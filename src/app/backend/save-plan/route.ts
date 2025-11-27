import { NextResponse } from 'next/server';
import { createPlan } from '@/lib/firebase-admin';

// Backend route for Python server (no Clerk auth required)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, summary } = body;
    
    if (!uid || !summary) {
      return NextResponse.json(
        { error: 'Missing required fields: uid and summary' },
        { status: 400 }
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
      caloriesIntake: 0,
      meals: []
    };
    
    // Always save session summary first (with workout/nutrition data)
    const { saveSessionSummary } = await import('@/lib/firebase-admin');
    const sessionData = {
      session_id: meta?.session_id || 'unknown',
      generated_at_utc: summaryData.generated_at_utc || new Date().toISOString(),
      language: summaryData.language || 'auto',
      summary: summaryData.summary || '',
      main_points: summaryData.main_points || [],
      fitness_topics_discussed: summaryData.fitness_topics_discussed || [],
      goals_or_hopes: summaryData.goals_or_hopes || [],
      action_items_suggested: summaryData.action_items_suggested || [],
      energy_level: summaryData.energy_level || 0,
      motivation_level: summaryData.motivation_level || 0,
      workout_adherence: summaryData.workout_adherence || '',
      recovery_quality: summaryData.recovery_quality || '',
      training_focus_areas: summaryData.training_focus_areas || [],
      workoutPlan: workoutPlan,
      nutritionPlan: nutritionPlan,
    };
    
    await saveSessionSummary(uid, sessionData);
    console.log(`[Backend] ✅ Session summary saved: ${meta?.session_id}`);
    
    // Check if there's COMPLETE plan data to save in plans collection
    const hasWorkoutData = workoutPlan.schedule?.length > 0 && workoutPlan.exercises?.length > 0;
    const hasNutritionData = nutritionPlan.caloriesIntake > 0 && nutritionPlan.meals?.length > 0;
    
    if (!hasWorkoutData || !hasNutritionData) {
      // No complete plan data yet, just session recorded
      console.log(`[Backend] Session recorded (incomplete plan data)`);
      return NextResponse.json({
        success: true,
        message: 'Session summary saved',
        sessionId: meta?.session_id
      });
    }
    
    // Create plan name from session data
    const planName = `Fitness Plan - ${new Date().toLocaleDateString()}`;
    
    console.log(`[Backend] Saving complete fitness plan for user ${uid}`);
    
    // Save COMPLETE plan to Firebase plans collection
    const result = await createPlan({
      userId: uid,
      name: planName,
      workoutPlan,
      nutritionPlan,
      isActive: true,
    });
    
    console.log(`[Backend] ✅ Complete plan saved to plans collection: ${result.planId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Session and complete plan saved successfully',
      planId: result.planId,
      sessionId: meta?.session_id,
    });
    
  } catch (error) {
    console.error('[Backend] Error saving fitness plan:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save fitness plan', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
