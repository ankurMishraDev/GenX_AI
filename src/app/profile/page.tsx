"use client";

import { useUser } from '@clerk/nextjs';
import { SignOutButton } from '@clerk/nextjs';
import React, { useEffect, useState } from 'react';

interface Plan {
  name: string;
  workoutPlan: {
    schedule: string[];
    exercises: Array<{
      day: string;
      routines: Array<{
        name: string;
        sets?: number;
        reps?: number;
        duration?: number;
        description?: string;
      }>;
    }>;
  };
  nutritionPlan: {
    caloriesIntake: number;
    meals: Array<{
      name: string;
      foods: string[];
    }>;
  };
  isActive: boolean;
  createdAt?: {
    toDate: () => Date;
  } | string | Date;
}

const ProfilePage = () => {
  const { user } = useUser();
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Fetch active plan from API route
    const fetchActivePlan = async () => {
      try {
        const response = await fetch('/api/plans?active=true');
        const data = await response.json();
        
        if (data.success && data.plan) {
          setActivePlan(data.plan);
        } else {
          setActivePlan(null);
        }
      } catch (error) {
        console.error('Error fetching active plan:', error);
        setActivePlan(null);
      } finally {
        setLoading(false);
      }
    };

    fetchActivePlan();
  }, [user?.id]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Profile Page</h1>
          <SignOutButton />
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Loading your fitness plan...</p>
          </div>
        ) : activePlan ? (
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">{activePlan.name}</h2>
                {activePlan.createdAt && (
                  <p className="text-sm text-muted-foreground">
                    Created on {typeof activePlan.createdAt === 'object' && 'toDate' in activePlan.createdAt
                      ? new Date(activePlan.createdAt.toDate()).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : new Date(activePlan.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })
                    }
                  </p>
                )}
              </div>

              {/* Workout Plan Section */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">Workout Plan</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Schedule: {activePlan.workoutPlan.schedule.join(', ')}
                </p>
                <div className="space-y-4">
                  {activePlan.workoutPlan.exercises.map((exercise, idx) => (
                    <div key={idx} className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">{exercise.day}</h4>
                      <ul className="mt-2 space-y-2">
                        {exercise.routines.map((routine, ridx) => (
                          <li key={ridx} className="text-sm">
                            <span className="font-medium">{routine.name}</span>
                            {routine.sets && routine.reps && (
                              <span className="text-muted-foreground">
                                {' '}
                                - {routine.sets} sets × {routine.reps} reps
                              </span>
                            )}
                            {routine.duration && (
                              <span className="text-muted-foreground">
                                {' '}
                                - {routine.duration} minutes
                              </span>
                            )}
                            {routine.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {routine.description}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nutrition Plan Section */}
              <div>
                <h3 className="text-xl font-semibold mb-3">Nutrition Plan</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Daily Calorie Target: {activePlan.nutritionPlan.caloriesIntake} kcal
                </p>
                <div className="grid gap-3">
                  {activePlan.nutritionPlan.meals.map((meal, idx) => (
                    <div key={idx} className="border rounded p-3">
                      <h4 className="font-semibold mb-2">{meal.name}</h4>
                      <ul className="list-disc list-inside text-sm">
                        {meal.foods.map((food, fidx) => (
                          <li key={fidx}>{food}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-card border rounded-lg">
            <div className="max-w-md mx-auto px-6">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 mx-auto text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Active Fitness Plan</h3>
              <p className="text-muted-foreground mb-6">
                You haven&apos;t generated a complete fitness plan yet. Start AI sessions to gather your fitness data and create a personalized workout and nutrition plan!
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/generate-program'}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Start New Session
                </button>
                <button
                  onClick={() => window.location.href = '/history'}
                  className="w-full px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  View Session History
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Track all your coaching sessions and progress on the History page
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
