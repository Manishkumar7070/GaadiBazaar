import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getRazorpay, getSupabaseClient } from '../clients';
import { serverLogger } from '../logger';
import { rateLimitHandler } from '../middleware/rate-limit-monitor';

const router = express.Router();

// Anti-abuse: Rate limit payment creations and verifications to defend against payment flooding or coupon bruteforcing
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Max 50 payment requests per IP per 15 minutes
  message: { error: "Too many payment operations. Please wait before attempting again." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

router.post("/create-order", paymentLimiter, authenticate, async (req: AuthRequest, res: any) => {
  const { vehicleId, amount, listingType } = req.body;
  
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!vehicleId || !amount || !listingType) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const razorpay = getRazorpay();
    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit
      currency: "INR",
      receipt: `receipt_vehicle_${vehicleId}_${Date.now()}`,
      notes: {
        userId: req.user.uid,
        vehicleId: vehicleId,
        listingType: listingType,
      }
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error: any) {
    serverLogger.error("[RAZORPAY] Error creating order", { error: error.message });
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

router.post("/verify-payment", paymentLimiter, authenticate, async (req: AuthRequest, res: any) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    vehicleId,
    amount
  } = req.body;
  
  if (!req.user || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !vehicleId) {
    return res.status(400).json({ error: "Missing required fields for verification" });
  }

  try {
    const secret = process.env.RAZORPAY_KEY_SECRET || '976YpoKpCMq7ouV40MNjyrNo';
    if (!secret) throw new Error("RAZORPAY_KEY_SECRET missing");

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      const supabase = getSupabaseClient();
      
      // Update vehicle status
      await supabase
        .from("vehicles")
        .update({ 
          payment_status: "paid",
          status: "active" 
        })
        .eq("id", vehicleId);

      // Record payment
      await supabase
        .from("payments")
        .insert([{
          user_id: req.user.uid,
          vehicle_id: vehicleId,
          amount: amount,
          payment_method: "razorpay",
          transaction_ref: razorpay_payment_id,
          status: "completed"
        }]);

      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      serverLogger.warn("[RAZORPAY] Invalid signature detected", { 
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      });
      res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
  } catch (error: any) {
    serverLogger.error("[RAZORPAY] Error verifying payment", { error: error.message });
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

export default router;
