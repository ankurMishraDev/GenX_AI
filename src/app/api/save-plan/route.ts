import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createPlan } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    // Verify authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { uid, summary } = body;
    
    // Verify the uid matches the authenticated user
    if (uid !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - User ID mismatch' },
        { status: 403 }
      );
    }
    
    const summaryData = summary?.summary_data;
    const meta = summary?.meta;
    
    if (!summaryData) {
      return NextResponse.json(
        { error: 'Missing summary data' },
        { status: 400 }
      );
    }
    
    // Extract workout and nutrition plans from summary
    const workoutPlan = summaryData.workoutPlan || {
      schedule: [],
      exercises: []
    };
    
    const nutritionPlan = summaryData.nutritionPlan || {
      dailyCalories: 0,
      meals: []
    };
    
    // Only create a plan if there's actual workout or nutrition data
    const hasWorkoutData = workoutPlan.schedule?.length > 0 || workoutPlan.exercises?.length > 0;
    const hasNutritionData = nutritionPlan.dailyCalories > 0 || nutritionPlan.meals?.length > 0;
    
    if (!hasWorkoutData && !hasNutritionData) {
      // No plan data to save, just acknowledge
      return NextResponse.json({
        success: true,
        message: 'Session recorded (no plan data to save)',
        sessionId: meta?.session_id
      });
    }
    
    // Create plan name from session data
    const planName = `Fitness Plan - ${new Date().toLocaleDateString()}`;
    
    // Save plan to Firebase
    const result = await createPlan({
      userId: uid,
      name: planName,
      workoutPlan,
      nutritionPlan,
      isActive: true, // New plans are active by default
    });
    
    return NextResponse.json({
      success: true,
      message: 'Fitness plan saved successfully',
      planId: result.planId,
      sessionId: meta?.session_id,
    });
    
  } catch (error) {
    console.error('Error saving fitness plan:', error);
    return NextResponse.json(
      { error: 'Failed to save fitness plan', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
