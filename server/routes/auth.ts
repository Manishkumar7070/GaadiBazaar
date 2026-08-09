import express from 'express';
import rateLimit from 'express-rate-limit';
import { getSupabaseClient } from '../clients';
import { serverLogger } from '../logger';
import twilio from 'twilio';
import { rateLimitHandler } from '../middleware/rate-limit-monitor';

const router = express.Router();

// Simple memory cache for verification codes (especially useful in fallback mode or standard text messages)
const otpStore = new Map<string, { code: string, expires: number }>();

// Anti-abuse: Rate limit OTP dispatch requests to prevent SMS pumping/billing attacks
const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Max 10 OTP requests per IP per 10 minutes
  message: { error: "Too many OTP verification requests. Please wait before requesting another code." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Prevention of OTP brute-force attacks
const otpVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // Max 15 verification trials per IP per 5 minutes
  message: { error: "Too many submission trials. Please wait before trying to verify again." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Helper to check and retrieve Twilio credentials safely
const getTwilioConfig = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (accountSid && authToken) {
    return { accountSid, authToken, verifyServiceSid };
  }
  return null;
};

// Send OTP via Twilio Verify or fallbacks
router.post("/send-otp", otpSendLimiter, async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  // Ensure standard E.164 phone formatting
  const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;

  serverLogger.info(`[OTP] Request to send OTP to ${formattedPhone}`);

  try {
    const config = getTwilioConfig();
    
    if (config) {
      const client = twilio(config.accountSid, config.authToken);
      
      // A. If TWILIO_VERIFY_SERVICE_SID is configured, use Twilio Verify Service (Sms)
      if (config.verifyServiceSid) {
        await client.verify.v2.services(config.verifyServiceSid)
          .verifications
          .create({ to: formattedPhone, channel: 'sms' });
        
        serverLogger.info(`[TWILIO] Verification code sent via Twilio Verify to ${formattedPhone}`);
        return res.json({ 
          success: true, 
          mode: 'twilio-verify', 
          message: 'Verification code sent successfully' 
        });
      }
      
      // B. If standard Twilio is configured but verify ID is missing, send normal SMS
      const senderPhone = process.env.TWILIO_PHONE_NUMBER;
      if (senderPhone) {
        const customCode = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(formattedPhone, {
          code: customCode,
          expires: Date.now() + 5 * 60 * 1000 // valid for 5 mins
        });

        await client.messages.create({
          body: `Your Asonedealer verification code is: ${customCode}. Valid for 5 minutes.`,
          from: senderPhone,
          to: formattedPhone
        });

        serverLogger.info(`[TWILIO] Verification code sent via standard SMS to ${formattedPhone}`);
        return res.json({ 
          success: true, 
          mode: 'twilio-sms', 
          message: 'Verification code sent successfully' 
        });
      }
    }

    // C. Non-configured / Dev Fallback Mode
    const fallbackCode = "123456";
    otpStore.set(formattedPhone, {
      code: fallbackCode,
      expires: Date.now() + 15 * 60 * 1000 // 15 mins
    });

    serverLogger.warn(`[OTP] TWILIO NOT FULLY CONFIGUERD ON BACKEND. RUNNING IN DEV FALLBACK MODE.`);
    serverLogger.warn(`👉 THE VERIFICATION OTP IS: ${fallbackCode} (Phone: ${formattedPhone}) 👈`);

    return res.json({
      success: true,
      mode: 'fallback',
      message: `Verification code sent. Use fallback '${fallbackCode}'`,
      devOtp: fallbackCode
    });

  } catch (err: any) {
    serverLogger.error(`[OTP Send API Error] Failed to send OTP to ${formattedPhone}`, { error: err.message });
    return res.status(500).json({ error: "Failed to dispatch verification code", details: err.message });
  }
});

// Verify OTP & Sign In to Supabase
router.post("/verify-otp", otpVerifyLimiter, async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: "Phone number and verification code are required" });
  }

  const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;

  try {
    const config = getTwilioConfig();
    let isApproved = false;

    // A. Verify with Twilio Verify Service if present
    if (config && config.verifyServiceSid) {
      const client = twilio(config.accountSid, config.authToken);
      const check = await client.verify.v2.services(config.verifyServiceSid)
        .verificationChecks
        .create({ to: formattedPhone, code: code });
      
      if (check.status === 'approved') {
        isApproved = true;
      }
    } else {
      // B. Verify via standard memory-backed map
      const record = otpStore.get(formattedPhone);
      if (record) {
        if (record.code === code && record.expires > Date.now()) {
          isApproved = true;
          otpStore.delete(formattedPhone); // Single-use consumption
        }
      }
    }

    if (!isApproved) {
      return res.status(400).json({ error: "Invalid dynamic code or verification expired." });
    }

    // Now, associate that with Supabase Auth
    const supabase = getSupabaseClient();
    const cleanNumbersOnly = formattedPhone.replace(/\D/g, '');
    const email = `phone_${cleanNumbersOnly}@asonedealer.phone`;
    
    // Create deterministic password based on phone and service role key for maximum security
    const secretPart = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback_server_auth_secret_xyz123";
    const password = `OTP_pwd_${cleanNumbersOnly}_${secretPart.substring(0, 16)}`;

    let sessionData: any = null;

    try {
      // Step A: Attempt standard email/password authentication
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInErr) {
        // Step B: If account doesn't exist yet, we create a secure, active user account administratively
        if (signInErr.message.includes('Invalid login credentials') || signInErr.status === 400 || signInErr.message.includes('not found')) {
          serverLogger.info(`[SUPABASE AUTH] Phone user ${email} first login. Provisioning account...`);
          
          const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            phone: formattedPhone,
            phone_confirm: true,
            user_metadata: {
              full_name: 'User',
              role: 'buyer'
            }
          });

          if (createErr) {
            throw new Error(`Admin user creation failed: ${createErr.message}`);
          }

          // Step C: Log them in to capture the fresh session token
          const { data: retrySignInData, error: retrySignInErr } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (retrySignInErr) {
            throw new Error(`Admin retry authentication failed: ${retrySignInErr.message}`);
          }

          sessionData = retrySignInData.session;
        } else {
          throw signInErr;
        }
      } else {
        sessionData = signInData.session;
      }

    } catch (authErr: any) {
      serverLogger.error(`[SUPABASE AUTH ERROR] Failed to authenticate or provision ${email}`, { error: authErr.message });
      return res.status(500).json({ error: "Authentication transaction failed", details: authErr.message });
    }

    // Step D: Insure core public.profiles table matches the Auth output
    try {
      const { data: extProfile, error: readErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionData.user.id)
        .single();

      if (!extProfile || readErr) {
        serverLogger.info(`[PROFILES] Creating main profile record in Supabase for user ${sessionData.user.id}`);
        const { error: insertErr } = await supabase.from('profiles').upsert({
          id: sessionData.user.id,
          phone: formattedPhone,
          full_name: 'User',
          role: 'buyer',
          is_profile_complete: false,
          updated_at: new Date().toISOString()
        });
        if (insertErr) {
          serverLogger.error('[PROFILES] Error creating user profile record', insertErr);
        }
      }
    } catch (profileCatchEx: any) {
      serverLogger.warn(`[PROFILES ALERT] Non-blocking profile check issue: ${profileCatchEx.message}`);
    }

    serverLogger.info(`[AUTH] Multi-factor authentication approved for ${formattedPhone}. JWT dispensed.`);

    return res.json({
      success: true,
      session: sessionData,
      user: sessionData.user
    });

  } catch (err: any) {
    serverLogger.error(`[OTP Verification API Error] Processing failure: ${err.message}`, { phone });
    return res.status(500).json({ error: "Verification processing failed", details: err.message });
  }
});

// Profile Completion directly referencing Supabase
router.post("/complete-profile", async (req, res) => {
  const { userId, role, name, phone, latitude, longitude, cityName, address } = req.body;
  if (!userId || !role) {
    return res.status(400).json({ error: "User ID and role are required" });
  }

  try {
    const supabase = getSupabaseClient();
    
    // Write profile data to Supabase public.profiles table
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      role,
      full_name: name || 'User',
      phone: phone || undefined,
      latitude: latitude !== undefined ? latitude : null,
      longitude: longitude !== undefined ? longitude : null,
      city_name: cityName || null,
      address: address || null,
      is_profile_complete: true,
      updated_at: new Date().toISOString()
    });

    if (error) {
      throw error;
    }

    serverLogger.info(`[PROFILES] Profile updated for user ${userId} on Supabase database`);
    res.json({ success: true, message: "Profile updated successfully inside Supabase" });

  } catch (error: any) {
    serverLogger.error("[PROFILES ERROR] Failed to update user profile", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

export default router;
