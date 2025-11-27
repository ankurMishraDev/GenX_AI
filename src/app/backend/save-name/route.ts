import { NextResponse } from 'next/server';
import { updateUserProfile } from '@/lib/firebase-admin';

// Backend route for Python server (no Clerk auth required)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, name } = body;
    
    if (!uid || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: uid and name' },
        { status: 400 }
      );
    }
    
    console.log(`[Backend] Updating name for user ${uid}: ${name}`);
    
    // Update user profile with extracted name
    await updateUserProfile(uid, { name });
    
    console.log(`[Backend] ✅ Name updated successfully`);
    
    return NextResponse.json({
      success: true,
      message: 'User name updated successfully',
    });
    
  } catch (error) {
    console.error('[Backend] Error saving user name:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save user name', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
