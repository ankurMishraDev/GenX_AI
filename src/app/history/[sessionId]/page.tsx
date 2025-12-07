"use client";

import { useUser } from '@clerk/nextjs';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Calendar, 
  Dumbbell, 
  Apple, 
  Target, 
  ArrowLeft,
  CheckCircle2,
  Activity
} from 'lucide-react';

interface Session {
  id: string;
  session_id: string;
  generated_at_utc: string;
  summary: string;
  main_points: string[];
  fitness_topics_discussed: string[];
  goals_or_hopes: string[];
  action_items_suggested: string[];
  energy_level: number;
  motivation_level: number;
  workout_adherence: string;
  recovery_quality: string;
  training_focus_areas: Array<{
    name: string;
    confidence: number;
  }>;
  workoutPlan?: {
    schedule: string[];
    exercises: Array<{
      day: string | { day: string; muscle_groups?: string[] };
      routines: Array<{
        name: string;
        sets?: number;
        reps?: number;
        duration?: number;
        description?: string;
      }>;
    }>;
  };
  nutritionPlan?: {
    caloriesIntake: number;
    meals: Array<{
      name: string;
      foods: string[];
    }>;
  };
  createdAt: string;
}

const SessionDetailPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !sessionId) return;

    const fetchSession = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sessions/${sessionId}`);
        const data = await response.json();

        if (data.success) {
          setSession(data.session);
        } else {
          console.error('Failed to fetch session');
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [user?.id, sessionId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Session Not Found</h2>
          <Button onClick={() => router.push('/history')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
        </div>
      </div>
    );
  }

  const hasWorkoutData = (session.workoutPlan?.schedule?.length ?? 0) > 0 || (session.workoutPlan?.exercises?.length ?? 0) > 0;
  const hasNutritionData = (session.nutritionPlan?.caloriesIntake ?? 0) > 0 || (session.nutritionPlan?.meals?.length ?? 0) > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/history')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Calendar className="w-4 h-4" />
            {formatDate(session.createdAt)}
          </div>
          <h1 className="text-3xl font-bold mb-2">Session Details</h1>
          
          {/* Status badges */}
          <div className="flex gap-2">
            {hasWorkoutData && (
              <span className="px-3 py-1 bg-blue-500/10 text-blue-600 text-sm rounded-full flex items-center gap-1">
                <Dumbbell className="w-4 h-4" />
                Workout Plan
              </span>
            )}
            {hasNutritionData && (
              <span className="px-3 py-1 bg-green-500/10 text-green-600 text-sm rounded-full flex items-center gap-1">
                <Apple className="w-4 h-4" />
                Nutrition Plan
              </span>
            )}
          </div>
        </div>

        {/* Summary */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">Session Summary</h2>
          <p className="text-muted-foreground leading-relaxed">{session.summary}</p>
        </Card>

        {/* Main Points */}
        {session.main_points?.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Key Discussion Points
            </h2>
            <ul className="space-y-2">
              {session.main_points.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Goals */}
        {session.goals_or_hopes?.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Goals & Aspirations</h2>
            <div className="flex flex-wrap gap-3">
              {session.goals_or_hopes.map((goal, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium"
                >
                  {goal}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Action Items */}
        {session.action_items_suggested?.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Action Items</h2>
            <ul className="space-y-2">
              {session.action_items_suggested.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                  </div>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Stats */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Session Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {session.energy_level > 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Energy Level</p>
                <p className="text-2xl font-bold">{session.energy_level}%</p>
              </div>
            )}
            {session.motivation_level > 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Motivation</p>
                <p className="text-2xl font-bold">{session.motivation_level}%</p>
              </div>
            )}
            {session.workout_adherence && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Adherence</p>
                <p className="text-lg font-bold">{session.workout_adherence}</p>
              </div>
            )}
            {session.recovery_quality && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Recovery</p>
                <p className="text-lg font-bold">{session.recovery_quality}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Workout Plan Details */}
        {hasWorkoutData && session.workoutPlan && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-blue-600" />
              Workout Plan
            </h2>
            
            {session.workoutPlan.schedule.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold mb-2">Weekly Schedule:</p>
                <div className="flex flex-wrap gap-2">
                  {session.workoutPlan.schedule.map((day, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-sm font-medium"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {session.workoutPlan.exercises.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold">Exercise Breakdown:</p>
                {session.workoutPlan.exercises.map((exercise, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h4 className="font-semibold text-lg mb-3">
                      {typeof exercise.day === 'string' ? exercise.day : exercise.day?.day || `Day ${idx + 1}`}
                    </h4>
                    <div className="space-y-2">
                      {exercise.routines.map((routine, ridx) => (
                        <div key={ridx} className="bg-muted/50 rounded-lg p-3">
                          <p className="font-medium">{routine.name}</p>
                          <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                            {routine.sets && routine.reps && (
                              <span>{routine.sets} sets × {routine.reps} reps</span>
                            )}
                            {routine.duration && (
                              <span>{routine.duration}s duration</span>
                            )}
                          </div>
                          {routine.description && (
                            <p className="text-sm text-muted-foreground mt-2">{routine.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Nutrition Plan Details */}
        {hasNutritionData && session.nutritionPlan && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Apple className="w-5 h-5 text-green-600" />
              Nutrition Plan
            </h2>
            
            {session.nutritionPlan.caloriesIntake > 0 && (
              <div className="mb-4 p-4 bg-green-500/5 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Daily Calorie Target</p>
                <p className="text-3xl font-bold text-green-600">{session.nutritionPlan.caloriesIntake} kcal</p>
              </div>
            )}

            {session.nutritionPlan.meals && session.nutritionPlan.meals.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold">Meal Plan:</p>
                {session.nutritionPlan.meals.map((meal, idx) => (
                  <div key={idx} className="border-l-4 border-green-500 pl-4 py-2">
                    <h4 className="font-semibold mb-2">{meal.name}</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {meal.foods.map((food, fidx) => (
                        <li key={fidx} className="text-sm text-muted-foreground">
                          {food}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Topics & Focus Areas */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {session.fitness_topics_discussed?.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-3">Topics Discussed</h2>
              <div className="flex flex-wrap gap-2">
                {session.fitness_topics_discussed.map((topic, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-muted text-muted-foreground rounded text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {session.training_focus_areas?.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-3">Training Focus</h2>
              <div className="space-y-2">
                {session.training_focus_areas.map((area, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{area.name.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-semibold text-primary">
                      {Math.round(area.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionDetailPage;
