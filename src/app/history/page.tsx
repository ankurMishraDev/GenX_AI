"use client";

import { useUser } from '@clerk/nextjs';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, TrendingUp, Eye, Dumbbell } from 'lucide-react';

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
      day: string;
      routines: Array<{
        name: string;
        sets?: number;
        reps?: number;
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

const HistoryPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);

  const fetchSessions = async (isLoadMore = false) => {
    if (!user?.id) return;

    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const url = lastSessionId && isLoadMore
        ? `/api/sessions?limit=5&lastSessionId=${lastSessionId}`
        : '/api/sessions?limit=5';

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        if (isLoadMore) {
          setSessions(prev => [...prev, ...data.sessions]);
        } else {
          setSessions(data.sessions);
        }
        setHasMore(data.hasMore);
        setLastSessionId(data.lastSessionId);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Session History</h1>
          <p className="text-muted-foreground">
            Track your fitness journey through AI coaching sessions
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading your session history...</p>
          </div>
        ) : sessions.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <Dumbbell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Sessions Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start your first AI coaching session to see your progress here
              </p>
              <Button asChild>
                <a href="/generate-program">Start Session</a>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {sessions.map((session, index) => (
              <Card key={session.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/history/${session.id}`)}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(session.createdAt)}
                    </div>
                    <h3 className="text-base font-semibold mb-2">
                      Session #{sessions.length - index}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {session.summary}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/history/${session.id}`);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center py-6">
                <Button
                  onClick={() => fetchSessions(true)}
                  disabled={loadingMore}
                  variant="outline"
                  size="lg"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Load More Sessions
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
