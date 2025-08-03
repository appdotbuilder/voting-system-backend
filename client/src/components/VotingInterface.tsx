
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { useState, useEffect } from 'react';
import type { PollWithDetails, User, PollOption, Vote } from '../../../server/src/schema';

interface VotingInterfaceProps {
  poll: PollWithDetails | null;
  currentUser: User | null;
  onVoteCast: () => void;
}

export function VotingInterface({ poll, currentUser, onVoteCast }: VotingInterfaceProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // Load user's votes for this poll
  useEffect(() => {
    const loadUserVotes = async () => {
      if (currentUser && poll) {
        try {
          const votes = await trpc.getUserVotes.query({ id: currentUser.id });
          // Check if user has already voted on this poll
          const votedOnThisPoll = votes.some((vote: Vote) => vote.poll_id === poll.id);
          setHasVoted(votedOnThisPoll);
        } catch (error) {
          console.error('Failed to load user votes:', error);
        }
      }
    };

    loadUserVotes();
  }, [currentUser, poll]);

  const handleVote = async () => {
    if (!currentUser || !poll || !selectedOption) return;

    setIsVoting(true);
    try {
      await trpc.castVote.mutate({
        poll_id: poll.id,
        option_id: parseInt(selectedOption),
        user_id: currentUser.id
      });
      
      setHasVoted(true);
      setSelectedOption('');
      onVoteCast(); // Refresh poll details
    } catch (error) {
      console.error('Failed to cast vote:', error);
      alert('Failed to cast vote. You may have already voted on this poll.');
    } finally {
      setIsVoting(false);
    }
  };

  if (!poll) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🗳️</div>
        <p className="text-gray-500 text-lg">Select a poll from the polls tab to start voting</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">👤</div>
        <p className="text-gray-500 text-lg">Please select a user account to vote</p>
      </div>
    );
  }

  const maxVotes = Math.max(...poll.options.map((option: PollOption) => option.vote_count));

  return (
    <div className="space-y-6">
      <Card className="border-indigo-200">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl text-indigo-800">{poll.title}</CardTitle>
              {poll.description && (
                <p className="text-gray-600 mt-2">{poll.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Badge variant={poll.is_active ? "default" : "secondary"}>
                {poll.is_active ? "🟢 Active" : "🔴 Inactive"}
              </Badge>
              <Badge variant="outline">
                📊 {poll.total_votes} votes
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {poll.is_active && !hasVoted ? "Cast Your Vote" : "Results"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {poll.is_active && !hasVoted ? (
            <div className="space-y-4">
              <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                {poll.options.map((option: PollOption) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id.toString()} id={`option-${option.id}`} />
                    <Label htmlFor={`option-${option.id}`} className="flex-1 cursor-pointer">
                      {option.option_text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              
              <Button
                onClick={handleVote}
                disabled={!selectedOption || isVoting}
                className="w-full"
              >
                {isVoting ? 'Casting Vote...' : '🗳️ Cast Vote'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {hasVoted && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
                  <p className="text-green-800">✅ You have already voted on this poll</p>
                </div>
              )}
              
              {poll.options.map((option: PollOption) => {
                const percentage = poll.total_votes > 0 ? (option.vote_count / poll.total_votes) * 100 : 0;
                const isWinning = option.vote_count === maxVotes && maxVotes > 0;
                
                return (
                  <div key={option.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`font-medium ${isWinning ? 'text-green-700' : 'text-gray-700'}`}>
                        {isWinning && poll.total_votes > 0 ? '🏆 ' : ''}{option.option_text}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {option.vote_count} votes
                        </span>
                        <span className="text-sm font-medium">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={percentage} 
                      className={`h-2 ${isWinning ? 'bg-green-100' : ''}`}
                    />
                  </div>
                );
              })}
              
              {poll.total_votes === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No votes cast yet. Be the first to vote!
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-gray-500">
        Voting as: <strong className="text-indigo-600">{currentUser.username}</strong>
      </div>
    </div>
  );
}
