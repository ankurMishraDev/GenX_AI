import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// GET /api/sessions/[sessionId] - Fetch individual session details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;

    const sessionDoc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('sessions')
      .doc(sessionId)
      .get();

    if (!sessionDoc.exists) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const sessionData = {
      id: sessionDoc.id,
      ...sessionDoc.data(),
      createdAt: sessionDoc.data()?.createdAt?.toDate().toISOString(),
    };

    return NextResponse.json({
      success: true,
      session: sessionData,
    });
  } catch (error) {
    console.error('[API] Error fetching session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
