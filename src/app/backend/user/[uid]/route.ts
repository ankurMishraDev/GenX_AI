import { NextResponse } from 'next/server';
import { getUserData } from '@/lib/firebase-admin';

// Backend route for Python server (no Clerk auth required)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    
    if (!uid) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      );
    }
    
    console.log(`[Backend] Fetching user data for ${uid}`);
    
    // Fetch user data for Python server context
    const userData = await getUserData(uid);
    
    if (!userData) {
      console.log(`[Backend] User ${uid} not found, returning default data`);
      // Return default data instead of 404 for new users
      return NextResponse.json({
        name: 'there',
        latestSummary: null
      });
    }
    
    console.log(`[Backend] ✅ User data retrieved for ${uid}`);
    return NextResponse.json(userData);
    
  } catch (error) {
    console.error('[Backend] Error fetching user data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch user data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
