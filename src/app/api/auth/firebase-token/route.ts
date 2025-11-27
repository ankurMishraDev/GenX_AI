import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

// Initialize Firebase Admin (reuse existing app or create new one)
if (!admin.apps.length) {
  const serviceAccountPath = join(process.cwd(), 'admin-key.json');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export async function GET() {
  try {
    // Get Clerk user ID from session
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - No user session' },
        { status: 401 }
      );
    }

    // Create custom Firebase token using Clerk's userId
    const customToken = await admin.auth().createCustomToken(userId);

    return NextResponse.json({ token: customToken });
  } catch (error) {
    console.error('Error creating Firebase token:', error);
    return NextResponse.json(
      { error: 'Failed to create Firebase token' },
      { status: 500 }
    );
  }
}
