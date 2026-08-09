import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getSupabaseClient } from '../clients';
import { cache } from '../lib/cache';
import { serverLogger } from '../logger';
import { rateLimitHandler } from '../middleware/rate-limit-monitor';

const router = express.Router();

// Anti-abuse: Limit review posting to prevent rating poisoning and comment flooding
const reviewsWriteLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Max 10 review submissions per IP per 5 minutes
  message: { error: "Too many review submissions. Please wait before submitting another review." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const syncAverageRating = async (targetId: string, targetType: 'vehicle' | 'shop' | 'seller') => {
  try {
    const supabase = getSupabaseClient();
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('target_id', targetId)
      .eq('target_type', targetType);

    if (error) throw error;

    const count = reviews?.length || 0;
    let totalRating = 0;
    if (reviews) {
      reviews.forEach(r => {
        totalRating += Number(r.rating);
      });
    }

    const avg = count > 0 
      ? parseFloat((totalRating / count).toFixed(1))
      : 0;

    let table = '';
    if (targetType === 'vehicle') table = 'vehicles';
    else if (targetType === 'shop') table = 'shops';
    else if (targetType === 'seller') table = 'profiles';

    if (table) {
      const { error: updateError } = await supabase
        .from(table)
        .update({ rating: avg, reviews_count: count })
        .eq('id', targetId);
        
      if (updateError) {
        serverLogger.warn(`Failed to update aggregate ratings in ${table} for target ${targetId}`, updateError);
      }
    }
    
    if (targetType === 'vehicle') {
      await cache.del("vehicles:all");
    }
  } catch (error) {
    serverLogger.error(`[REVIEWS] Error syncing average rating with Supabase`, { error });
  }
};

router.get("/:targetType/:targetId", async (req, res) => {
  const { targetType, targetId } = req.params;
  
  if (!['vehicle', 'shop', 'seller'].includes(targetType)) {
    return res.status(400).json({ error: "Invalid target type" });
  }

  try {
    const supabase = getSupabaseClient();
    
    // Fetch reviews from Supabase, joining on profiles to retrieve full_name & role
    const { data: dbReviews, error } = await supabase
      .from('reviews')
      .select('*, profiles:user_id(full_name, role)')
      .eq('target_id', targetId)
      .eq('target_type', targetType)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const reviews = (dbReviews || []).map(r => ({
      id: r.id,
      user_id: r.user_id,
      target_id: r.target_id,
      target_type: r.target_type,
      rating: r.rating,
      comment: r.comment,
      images: r.images,
      created_at: r.created_at,
      // Map joined profile attributes to match expected frontend interface smoothly
      user_name: r.profiles?.full_name || "Anonymous",
      user_role: r.profiles?.role || "buyer"
    }));
    
    res.json(reviews);
  } catch (error: any) {
    serverLogger.error("[REVIEWS] Error fetching reviews from Supabase", { error: error.message });
    res.json([]);
  }
});

router.post("/", reviewsWriteLimiter, authenticate, async (req: AuthRequest, res: any) => {
  const { userId, targetId, targetType, rating, comment, images } = req.body;

  if (!req.user || req.user.uid !== userId) {
    return res.status(401).json({ error: "Unauthorized", message: "Invalid user session" });
  }

  if (!userId || !targetId || !targetType || !rating) {
    return res.status(400).json({ error: "Missing required review fields" });
  }

  try {
    const supabase = getSupabaseClient();

    // Check pre-existing review to avoid multiple entries from same user
    const { data: existingReviews, error: checkError } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", userId)
      .eq("target_id", targetId)
      .eq("target_type", targetType)
      .limit(1);

    if (existingReviews && existingReviews.length > 0) {
      return res.status(409).json({ error: "You have already reviewed this item" });
    }

    const newReview = {
      user_id: userId,
      target_id: targetId,
      target_type: targetType,
      rating: Number(rating),
      comment: comment || "",
      images: images || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: inserted, error: insertError } = await supabase
      .from("reviews")
      .insert(newReview)
      .select('*, profiles:user_id(full_name, role)')
      .single();

    if (insertError) throw insertError;

    // Trigger aggregate ratings update
    syncAverageRating(targetId, targetType);

    res.status(201).json({ 
      message: "Review submitted successfully", 
      review: { 
        id: inserted.id, 
        ...newReview,
        user_name: inserted.profiles?.full_name || "User",
        user_role: inserted.profiles?.role || "buyer"
      } 
    });
  } catch (error: any) {
    serverLogger.error("[REVIEWS] Error submitting review to Supabase", { error: error.message });
    res.status(500).json({ error: "Failed to submit review" });
  }
});

export default router;
