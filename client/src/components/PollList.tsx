
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { Poll } from '../../../server/src/schema';

interface PollListProps {
  polls: Poll[];
  onPollSelect: (poll: Poll) => void;
  onPollsChange: (polls: Poll[]) => void;
}

export function PollList({ polls, onPollSelect, onPollsChange }: PollListProps) {
  const [deletingPollId, setDeletingPollId] = useState<number | null>(null);

  const handleDeletePoll = async (pollId: number) => {
    setDeletingPollId(pollId);
    try {
      await trpc.deletePoll.mutate({ id: pollId });
      onPollsChange(polls.filter((poll: Poll) => poll.id !== pollId));
    } catch (error) {
      console.error('Failed to delete poll:', error);
    } finally {
      setDeletingPollId(null);
    }
  };

  const handleTogglePollStatus = async (poll: Poll) => {
    try {
      await trpc.updatePoll.mutate({
        id: poll.id,
        is_active: !poll.is_active
      });
      
      onPollsChange(polls.map((p: Poll) => 
        p.id === poll.id ? { ...p, is_active: !p.is_active } : p
      ));
    } catch (error) {
      console.error('Failed to toggle poll status:', error);
    }
  };

  if (polls.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📝</div>
        <p className="text-gray-500 text-lg">No polls created yet.</p>
        <p className="text-gray-400">Create your first poll to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {polls.map((poll: Poll) => (
        <Card key={poll.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg text-indigo-800">{poll.title}</CardTitle>
                {poll.description && (
                  <CardDescription className="mt-1">{poll.description}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={poll.is_active ? "default" : "secondary"}>
                  {poll.is_active ? "🟢 Active" : "🔴 Inactive"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Created: {poll.created_at.toLocaleDateString()}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTogglePollStatus(poll)}
                >
                  {poll.is_active ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onPollSelect(poll)}
                  disabled={!poll.is_active}
                >
                  {poll.is_active ? "Vote Now" : "View Results"}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Poll</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{poll.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeletePoll(poll.id)}
                        disabled={deletingPollId === poll.id}
                      >
                        {deletingPollId === poll.id ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
