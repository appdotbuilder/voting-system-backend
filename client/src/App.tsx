
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { PollList } from '@/components/PollList';
import { CreatePoll } from '@/components/CreatePoll';
import { UserManagement } from '@/components/UserManagement';
import { VotingInterface } from '@/components/VotingInterface';
// Using type-only import for better TypeScript compliance
import type { Poll, User, PollWithDetails } from '../../server/src/schema';

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<PollWithDetails | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('polls');

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.getUsers.query();
      setUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  // Load polls
  const loadPolls = useCallback(async () => {
    try {
      const result = await trpc.getPolls.query();
      setPolls(result);
    } catch (error) {
      console.error('Failed to load polls:', error);
    }
  }, []);

  // Load poll details
  const loadPollDetails = useCallback(async (pollId: number) => {
    try {
      const result = await trpc.getPoll.query({ id: pollId });
      setSelectedPoll(result);
    } catch (error) {
      console.error('Failed to load poll details:', error);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadPolls();
  }, [loadUsers, loadPolls]);

  const handlePollCreated = (newPoll: Poll) => {
    setPolls((prev: Poll[]) => [...prev, newPoll]);
  };

  const handleUserCreated = (newUser: User) => {
    setUsers((prev: User[]) => [...prev, newUser]);
  };

  const handlePollSelect = (poll: Poll) => {
    loadPollDetails(poll.id);
    setActiveTab('vote');
  };

  const handleVoteCast = () => {
    // Refresh poll details after voting
    if (selectedPoll) {
      loadPollDetails(selectedPoll.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">🗳️ Voting System</h1>
          <p className="text-indigo-600">Create polls, cast votes, and see results in real-time</p>
        </header>

        {/* User Selection */}
        {users.length > 0 && (
          <Card className="mb-6 border-indigo-200">
            <CardHeader>
              <CardTitle className="text-indigo-800">👤 Select Your Account</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {users.map((user: User) => (
                  <button
                    key={user.id}
                    onClick={() => setCurrentUser(user)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      currentUser?.id === user.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    }`}
                  >
                    {user.username}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="polls" className="text-sm">📊 Polls</TabsTrigger>
            <TabsTrigger value="create" className="text-sm">➕ Create</TabsTrigger>
            <TabsTrigger value="vote" className="text-sm">🗳️ Vote</TabsTrigger>
            <TabsTrigger value="users" className="text-sm">👥 Users</TabsTrigger>
          </TabsList>

          <TabsContent value="polls">
            <Card>
              <CardHeader>
                <CardTitle className="text-indigo-800">All Polls</CardTitle>
                <CardDescription>Browse and select polls to vote on</CardDescription>
              </CardHeader>
              <CardContent>
                <PollList 
                  polls={polls} 
                  onPollSelect={handlePollSelect}
                  onPollsChange={setPolls}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle className="text-indigo-800">Create New Poll</CardTitle>
                <CardDescription>Set up a new poll with multiple options</CardDescription>
              </CardHeader>
              <CardContent>
                <CreatePoll 
                  users={users} 
                  onPollCreated={handlePollCreated}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vote">
            <Card>
              <CardHeader>
                <CardTitle className="text-indigo-800">Voting Interface</CardTitle>
                <CardDescription>Cast your vote and see live results</CardDescription>
              </CardHeader>
              <CardContent>
                <VotingInterface 
                  poll={selectedPoll}
                  currentUser={currentUser}
                  onVoteCast={handleVoteCast}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="text-indigo-800">User Management</CardTitle>
                <CardDescription>Create new user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement 
                  users={users}
                  onUserCreated={handleUserCreated}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
