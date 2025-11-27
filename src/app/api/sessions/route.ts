import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// GET /api/sessions - Fetch user's session history with pagination
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    const lastSessionId = searchParams.get('lastSessionId');

    let query = adminDb
      .collection('users')
      .doc(userId)
      .collection('sessions')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    // If we have a lastSessionId, start after that document for pagination
    if (lastSessionId) {
      const lastDoc = await adminDb
        .collection('users')
        .doc(userId)
        .collection('sessions')
        .doc(lastSessionId)
        .get();
      
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.get();
    
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
    }));

    const hasMore = snapshot.docs.length === limit;

    return NextResponse.json({
      success: true,
      sessions,
      hasMore,
      lastSessionId: sessions.length > 0 ? sessions[sessions.length - 1].id : null,
    });
  } catch (error) {
    console.error('[API] Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
