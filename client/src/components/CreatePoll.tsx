
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { CreatePollInput, Poll, User } from '../../../server/src/schema';

interface CreatePollProps {
  users: User[];
  onPollCreated: (poll: Poll) => void;
}

export function CreatePoll({ users, onPollCreated }: CreatePollProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePollInput>({
    title: '',
    description: null,
    created_by: 0,
    options: ['', '']
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.created_by === 0) {
      alert('Please select a user to create the poll');
      return;
    }

    const validOptions = formData.options.filter((option: string) => option.trim() !== '');
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    setIsLoading(true);
    try {
      const response = await trpc.createPoll.mutate({
        ...formData,
        options: validOptions
      });
      onPollCreated(response);
      // Reset form
      setFormData({
        title: '',
        description: null,
        created_by: 0,
        options: ['', '']
      });
    } catch (error) {
      console.error('Failed to create poll:', error);
      alert('Failed to create poll. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData((prev: CreatePollInput) => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData((prev: CreatePollInput) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setFormData((prev: CreatePollInput) => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">👥</div>
        <p className="text-gray-500">Please create a user account first to create polls.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Poll Creator</label>
          <Select
            value={formData.created_by.toString()}
            onValueChange={(value: string) => 
              setFormData((prev: CreatePollInput) => ({ ...prev, created_by: parseInt(value) }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user: User) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Poll Title</label>
          <Input
            placeholder="What would you like to ask?"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreatePollInput) => ({ ...prev, title: e.target.value }))
            }
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description (optional)</label>
          <Textarea
            placeholder="Add more context to your poll..."
            value={formData.description || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: CreatePollInput) => ({
                ...prev,
                description: e.target.value || null
              }))
            }
            rows={3}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Poll Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.options.map((option: string, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateOption(index, e.target.value)
                }
                className="flex-1"
              />
              {formData.options.length > 2 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeOption(index)}
                >
                  ❌
                </Button>
              )}
            </div>
          ))}
          
          {formData.options.length < 10 && (
            <Button
              type="button"
              variant="outline"
              onClick={addOption}
              className="w-full"
            >
              ➕ Add Option
            </Button>
          )}
        </CardContent>
      </Card>

      <Button 
        type="submit" 
        disabled={isLoading || formData.created_by === 0}
        className="w-full"
      >
        {isLoading ? 'Creating Poll...' : '🗳️ Create Poll'}
      </Button>
    </form>
  );
}
