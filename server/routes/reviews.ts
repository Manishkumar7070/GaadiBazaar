import express from 'express';
import admin from 'firebase-admin';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getFirestore, getSupabaseClient } from '../clients';
import { cache } from '../lib/cache';
import { serverLogger } from '../logger';

const router = express.Router();

const syncAverageRating = async (targetId: string, targetType: 'vehicle' | 'shop' | 'seller') => {
  try {
    const db = getFirestore();
    const reviewsSnapshot = await db.collection("reviews")
      .where("target_id", "==", targetId)
      .where("target_type", "==", targetType)
      .get();

    const count = reviewsSnapshot.size;
    let totalRating = 0;
    reviewsSnapshot.forEach(doc => {
      totalRating += doc.data().rating;
    });

    const avg = count > 0 
      ? parseFloat((totalRating / count).toFixed(1))
      : 0;

    let targetCollection = '';
    if (targetType === 'vehicle') targetCollection = 'vehicles';
    else if (targetType === 'shop') targetCollection = 'shops';
    else if (targetType === 'seller') targetCollection = 'profiles';

    try {
      await db.collection(targetCollection).doc(targetId).set({ 
        rating: avg, 
        reviews_count: count,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (fErr) {
      // Ignore if not exists
    }

    try {
      const table = targetType === 'vehicle' ? 'vehicles' : 'shops';
      await getSupabaseClient()
        .from(table)
        .update({ rating: avg, reviews_count: count })
        .eq('id', targetId);
    } catch (sErr) {
      serverLogger.warn(`Supabase sync skipped for ${targetId}: ${targetType}`);
    }
    
    if (targetType === 'vehicle') {
      await cache.del("vehicles:all");
    }
  } catch (error) {
    serverLogger.error(`[REVIEWS] Error syncing average rating`, { error });
  }
};

router.get("/:targetType/:targetId", async (req, res) => {
  const { targetType, targetId } = req.params;
  
  if (!['vehicle', 'shop', 'seller'].includes(targetType)) {
    return res.status(400).json({ error: "Invalid target type" });
  }

  try {
    const db = getFirestore();
    const reviewsSnapshot = await db.collection("reviews")
      .where("target_id", "==", targetId)
      .where("target_type", "==", targetType)
      .orderBy('created_at', 'desc')
      .get();

    const reviews = reviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(reviews);
  } catch (error: any) {
    serverLogger.error("[REVIEWS] Error fetching reviews from Firestore", { error: error.message });
    res.json([]);
  }
});

router.post("/", authenticate, async (req: AuthRequest, res: any) => {
  const { userId, targetId, targetType, rating, comment, images, userName, userRole } = req.body;

  if (!req.user || req.user.uid !== userId) {
    return res.status(401).json({ error: "Unauthorized", message: "Invalid user session" });
  }

  if (!userId || !targetId || !targetType || !rating) {
    return res.status(400).json({ error: "Missing required review fields" });
  }

  try {
    const db = getFirestore();
    const existingQuery = await db.collection("reviews")
      .where("user_id", "==", userId)
      .where("target_id", "==", targetId)
      .where("target_type", "==", targetType)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      return res.status(409).json({ error: "You have already reviewed this item" });
    }

    const newReview = {
      user_id: userId,
      user_name: userName || req.user.name || "Anonymous",
      user_role: userRole || "buyer",
      target_id: targetId,
      target_type: targetType,
      rating: Number(rating),
      comment: comment || "",
      images: images || [],
      created_at: new Date().toISOString()
    };

    const docRef = await db.collection("reviews").add(newReview);
    syncAverageRating(targetId, targetType);

    res.status(201).json({ 
      message: "Review submitted successfully", 
      review: { id: docRef.id, ...newReview } 
    });
  } catch (error: any) {
    serverLogger.error("[REVIEWS] Error submitting review", { error: error.message });
    res.status(500).json({ error: "Failed to submit review" });
  }
});

export default router;
