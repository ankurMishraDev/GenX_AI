import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

// Initialize Firebase Admin SDK (singleton pattern)
if (!admin.apps.length) {
  try {
    const serviceAccountPath = join(process.cwd(), 'admin-key.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
    
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();

// Types matching the fitness plan schema
export interface WorkoutRoutine {
  name: string;
  sets?: number;
  reps?: number;
  duration?: number;
  description?: string;
  exercises?: string[];
}

export interface WorkoutExercise {
  day: string;
  routines: WorkoutRoutine[];
}

export interface WorkoutPlan {
  schedule: string[];
  exercises: WorkoutExercise[];
}

export interface Meal {
  name: string;
  foods: string[];
}

export interface NutritionPlan {
  caloriesIntake: number;
  meals: Meal[];
}

export interface FitnessPlan {
  userId: string;
  name: string;
  workoutPlan: WorkoutPlan;
  nutritionPlan: NutritionPlan;
  isActive: boolean;
  createdAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
}

export interface UserProfile {
  email: string;
  name?: string;
  age?: number;
  gender?: string;
  height?: string;
  weight?: string;
  fitnessGoals?: string;
  currentFitnessLevel?: string;
  workoutDays?: number;
  injuries?: string;
  dietaryRestrictions?: string;
  equipmentAccess?: string;
  trainingPreferences?: string;
}

/**
 * Sync user data to Firestore (called from Clerk webhook)
 */
export async function syncUser(data: {
  clerkId: string;
  email: string;
  name?: string;
  image?: string;
}) {
  const { clerkId, email, name, image } = data;
  
  const userRef = adminDb.collection('users').doc(clerkId);
  const profileRef = userRef.collection('profile').doc('info');
  
  await profileRef.set({
    email,
    name: name || '',
    image: image || '',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  
  return { success: true, userId: clerkId };
}

/**
 * Create a new fitness plan for a user
 */
export async function createPlan(planData: Omit<FitnessPlan, 'createdAt' | 'updatedAt'>) {
  const { userId, ...rest } = planData;
  
  // If this plan is active, deactivate all other plans for this user
  if (planData.isActive) {
    const activePlansSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('plans')
      .where('isActive', '==', true)
      .get();
    
    const batch = adminDb.batch();
    activePlansSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isActive: false });
    });
    await batch.commit();
  }
  
  const planRef = adminDb
    .collection('users')
    .doc(userId)
    .collection('plans')
    .doc();
  
  await planRef.set({
    ...rest,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  return { success: true, planId: planRef.id };
}

/**
 * Get the active fitness plan for a user
 */
export async function getActivePlan(userId: string): Promise<FitnessPlan | null> {
  const snapshot = await adminDb
    .collection('users')
    .doc(userId)
    .collection('plans')
    .where('isActive', '==', true)
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return { userId, ...doc.data() } as FitnessPlan;
}

/**
 * Save session summary to Firestore
 */
export async function saveSessionSummary(userId: string, sessionData: Record<string, unknown>) {
  await adminDb.collection('users').doc(userId).collection('sessions').add({
    ...sessionData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Get all fitness plans for a user (sorted by creation date, newest first)
 */
export async function getAllPlans(userId: string): Promise<FitnessPlan[]> {
  const snapshot = await adminDb
    .collection('users')
    .doc(userId)
    .collection('plans')
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({
    userId,
    id: doc.id,
    ...doc.data()
  })) as FitnessPlan[];
}

/**
 * Get user profile data
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const profileRef = adminDb
    .collection('users')
    .doc(userId)
    .collection('profile')
    .doc('info');
  
  const doc = await profileRef.get();
  
  if (!doc.exists) {
    return null;
  }
  
  return doc.data() as UserProfile;
}

/**
 * Update user profile data
 */
export async function updateUserProfile(userId: string, data: Partial<UserProfile>) {
  const profileRef = adminDb
    .collection('users')
    .doc(userId)
    .collection('profile')
    .doc('info');
  
  await profileRef.set({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  
  return { success: true };
}

/**
 * Get user data (for Python server context generation)
 */
export async function getUserData(userId: string) {
  const profileRef = adminDb
    .collection('users')
    .doc(userId)
    .collection('profile')
    .doc('info');
  
  const profileDoc = await profileRef.get();
  
  if (!profileDoc.exists) {
    return null;
  }
  
  const profile = profileDoc.data();
  
  // Get latest plan summary
  const activePlan = await getActivePlan(userId);
  
  return {
    name: profile?.name || 'there',
    latestSummary: activePlan ? {
      summary_data: {
        workoutPlan: activePlan.workoutPlan,
        nutritionPlan: activePlan.nutritionPlan,
        planName: activePlan.name,
      }
    } : null,
  };
}

export default admin;
