"use client";

import { useUser } from '@clerk/nextjs';
import { SignOutButton } from '@clerk/nextjs';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mail, User as UserIcon, Calendar } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useUser();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center py-12">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Profile</h1>
          <SignOutButton>
            <Button variant="outline">Sign Out</Button>
          </SignOutButton>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center gap-6 mb-6">
            {user.imageUrl && (
              <img
                src={user.imageUrl}
                alt={user.fullName || 'User'}
                className="w-20 h-20 rounded-full border-2 border-primary"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold">{user.fullName || 'User'}</h2>
              <p className="text-muted-foreground">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <UserIcon className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium">{user.username || user.firstName || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.primaryEmailAddress?.emailAddress || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Account Created</p>
                <p className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button
              onClick={() => window.location.href = '/plan'}
              variant="outline"
              className="w-full justify-start"
            >
              View My Fitness Plan
            </Button>
            <Button
              onClick={() => window.location.href = '/history'}
              variant="outline"
              className="w-full justify-start"
            >
              View Session History
            </Button>
            <Button
              onClick={() => window.location.href = '/generate-program'}
              variant="outline"
              className="w-full justify-start"
            >
              Start New AI Session
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
