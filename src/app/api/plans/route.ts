import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getActivePlan, getAllPlans } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    // Verify authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    
    if (activeOnly) {
      // Get only the active plan
      const activePlan = await getActivePlan(userId);
      
      return NextResponse.json({
        success: true,
        plan: activePlan,
      });
    } else {
      // Get all plans
      const plans = await getAllPlans(userId);
      
      return NextResponse.json({
        success: true,
        plans,
      });
    }
    
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
