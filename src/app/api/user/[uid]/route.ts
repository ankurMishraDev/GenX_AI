import { NextResponse } from 'next/server';
import { getUserData } from '@/lib/firebase-admin';

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
    
    // Fetch user data for Python server context
    const userData = await getUserData(uid);
    
    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(userData);
    
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
