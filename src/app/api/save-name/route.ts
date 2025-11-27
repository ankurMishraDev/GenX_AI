import { NextResponse } from 'next/server';
import { updateUserProfile } from '@/lib/firebase-admin';

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
    
    // Update user profile with extracted name
    await updateUserProfile(uid, { name });
    
    return NextResponse.json({
      success: true,
      message: 'User name updated successfully',
    });
    
  } catch (error) {
    console.error('Error saving user name:', error);
    return NextResponse.json(
      { error: 'Failed to save user name', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
