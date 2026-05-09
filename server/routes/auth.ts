import express from 'express';
import admin from 'firebase-admin';
import { getFirestore } from '../clients';
import { serverLogger } from '../logger';

const router = express.Router();

router.post("/complete-profile", async (req, res) => {
  const { userId, role, name, phone, latitude, longitude, cityName, address } = req.body;
  if (!userId || !role) return res.status(400).json({ error: "User ID and role are required" });

  try {
    const db = getFirestore();
    await db.collection("profiles").doc(userId).set({
      role,
      fullName: name,
      phone: phone,
      latitude,
      longitude,
      cityName,
      address,
      isProfileComplete: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({ message: "Profile updated successfully" });
  } catch (error: any) {
    serverLogger.error("Error updating profile", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

export default router;
