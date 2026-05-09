import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getStripe, getSupabaseClient } from '../clients';
import { serverLogger } from '../logger';

const router = express.Router();

router.post("/create-checkout-session", authenticate, async (req: AuthRequest, res: any) => {
  const { vehicleId, amount, listingType, successUrl, cancelUrl } = req.body;
  
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!vehicleId || !amount || !listingType) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `${listingType.toUpperCase()} Listing for Vehicle`,
              description: `Activation fee for vehicle listing ID: ${vehicleId}`,
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&vehicle_id=${vehicleId}`,
      cancel_url: cancelUrl,
      metadata: {
        userId: req.user.uid,
        vehicleId: vehicleId,
        listingType: listingType,
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error: any) {
    serverLogger.error("[STRIPE] Error creating checkout session", { error: error.message });
    res.status(500).json({ error: "Failed to create payment session" });
  }
});

router.get("/verify-session", authenticate, async (req: AuthRequest, res: any) => {
  const { sessionId, vehicleId } = req.query;
  
  if (!req.user || !sessionId || !vehicleId) {
    return res.status(400).json({ error: "Missing session ID or vehicle ID" });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId as string);

    if (session.payment_status === "paid") {
      const supabase = getSupabaseClient();
      
      await supabase
        .from("vehicles")
        .update({ 
          payment_status: "paid",
          status: "active" 
        })
        .eq("id", vehicleId);

      await supabase
        .from("payments")
        .insert([{
          user_id: req.user.uid,
          vehicle_id: vehicleId,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          payment_method: "stripe",
          transaction_ref: session.id,
          status: "completed"
        }]);

      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.json({ success: false, message: "Payment not completed" });
    }
  } catch (error: any) {
    serverLogger.error("[STRIPE] Error verifying session", { error: error.message });
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

export default router;
