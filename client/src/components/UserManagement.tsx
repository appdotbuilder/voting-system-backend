
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { CreateUserInput, User } from '../../../server/src/schema';

interface UserManagementProps {
  users: User[];
  onUserCreated: (user: User) => void;
}

export function UserManagement({ users, onUserCreated }: UserManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateUserInput>({
    username: '',
    email: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createUser.mutate(formData);
      onUserCreated(response);
      // Reset form
      setFormData({
        username: '',
        email: ''
      });
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user. Username or email might already exist.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Username</label>
          <Input
            placeholder="Enter username (3-50 characters)"
            value={formData.username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
            }
            required
            minLength={3}
            maxLength={50}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <Input
            type="email"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
            }
            required
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Creating User...' : '👤 Create User'}
        </Button>
      </form>

      {users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Existing Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map((user: User) => (
                <div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    Joined: {user.created_at.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
