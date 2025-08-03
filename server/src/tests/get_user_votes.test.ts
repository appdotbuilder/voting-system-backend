
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, pollsTable, pollOptionsTable, votesTable } from '../db/schema';
import { type GetUserInput } from '../schema';
import { getUserVotes } from '../handlers/get_user_votes';

describe('getUserVotes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return votes for a specific user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test poll
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Test Poll',
        description: 'A test poll',
        created_by: userId
      })
      .returning()
      .execute();
    const pollId = pollResult[0].id;

    // Create poll options
    const optionResults = await db.insert(pollOptionsTable)
      .values([
        { poll_id: pollId, option_text: 'Option 1' },
        { poll_id: pollId, option_text: 'Option 2' }
      ])
      .returning()
      .execute();
    const optionId = optionResults[0].id;

    // Create votes for the user
    await db.insert(votesTable)
      .values([
        { poll_id: pollId, option_id: optionId, user_id: userId }
      ])
      .execute();

    const input: GetUserInput = { id: userId };
    const result = await getUserVotes(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe(userId);
    expect(result[0].poll_id).toBe(pollId);
    expect(result[0].option_id).toBe(optionId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array for user with no votes', async () => {
    // Create test user but no votes
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const input: GetUserInput = { id: userId };
    const result = await getUserVotes(input);

    expect(result).toHaveLength(0);
  });

  it('should return multiple votes for user with multiple votes', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create multiple polls
    const pollResults = await db.insert(pollsTable)
      .values([
        { title: 'Test Poll 1', created_by: userId },
        { title: 'Test Poll 2', created_by: userId }
      ])
      .returning()
      .execute();

    // Create options for both polls
    const optionResults = await db.insert(pollOptionsTable)
      .values([
        { poll_id: pollResults[0].id, option_text: 'Poll 1 Option 1' },
        { poll_id: pollResults[1].id, option_text: 'Poll 2 Option 1' }
      ])
      .returning()
      .execute();

    // Create votes for different polls
    await db.insert(votesTable)
      .values([
        { poll_id: pollResults[0].id, option_id: optionResults[0].id, user_id: userId },
        { poll_id: pollResults[1].id, option_id: optionResults[1].id, user_id: userId }
      ])
      .execute();

    const input: GetUserInput = { id: userId };
    const result = await getUserVotes(input);

    expect(result).toHaveLength(2);
    result.forEach(vote => {
      expect(vote.user_id).toBe(userId);
      expect(vote.id).toBeDefined();
      expect(vote.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return votes only for the specified user', async () => {
    // Create two test users
    const userResults = await db.insert(usersTable)
      .values([
        { username: 'user1', email: 'user1@example.com' },
        { username: 'user2', email: 'user2@example.com' }
      ])
      .returning()
      .execute();
    const user1Id = userResults[0].id;
    const user2Id = userResults[1].id;

    // Create test poll
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Test Poll',
        created_by: user1Id
      })
      .returning()
      .execute();
    const pollId = pollResult[0].id;

    // Create poll options
    const optionResults = await db.insert(pollOptionsTable)
      .values([
        { poll_id: pollId, option_text: 'Option 1' },
        { poll_id: pollId, option_text: 'Option 2' }
      ])
      .returning()
      .execute();

    // Create votes for both users
    await db.insert(votesTable)
      .values([
        { poll_id: pollId, option_id: optionResults[0].id, user_id: user1Id },
        { poll_id: pollId, option_id: optionResults[1].id, user_id: user2Id }
      ])
      .execute();

    // Get votes for user1 only
    const input: GetUserInput = { id: user1Id };
    const result = await getUserVotes(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe(user1Id);
    expect(result[0].option_id).toBe(optionResults[0].id);
  });
});
