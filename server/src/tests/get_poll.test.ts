
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, pollsTable, pollOptionsTable } from '../db/schema';
import { type GetPollInput } from '../schema';
import { getPoll } from '../handlers/get_poll';

describe('getPoll', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent poll', async () => {
    const input: GetPollInput = { id: 999 };
    const result = await getPoll(input);
    expect(result).toBeNull();
  });

  it('should return poll with options', async () => {
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
        created_by: userId,
        is_active: true
      })
      .returning()
      .execute();

    const pollId = pollResult[0].id;

    // Create poll options
    await db.insert(pollOptionsTable)
      .values([
        {
          poll_id: pollId,
          option_text: 'Option 1',
          vote_count: 5
        },
        {
          poll_id: pollId,
          option_text: 'Option 2',
          vote_count: 3
        }
      ])
      .execute();

    const input: GetPollInput = { id: pollId };
    const result = await getPoll(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(pollId);
    expect(result!.title).toBe('Test Poll');
    expect(result!.description).toBe('A test poll');
    expect(result!.created_by).toBe(userId);
    expect(result!.is_active).toBe(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.options).toHaveLength(2);
    expect(result!.total_votes).toBe(8);

    // Check options
    const option1 = result!.options.find(opt => opt.option_text === 'Option 1');
    const option2 = result!.options.find(opt => opt.option_text === 'Option 2');

    expect(option1).toBeDefined();
    expect(option1!.vote_count).toBe(5);
    expect(option2).toBeDefined();
    expect(option2!.vote_count).toBe(3);
  });

  it('should return poll with no options', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser2',
        email: 'test2@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test poll without options
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Poll Without Options',
        description: null,
        created_by: userId,
        is_active: false
      })
      .returning()
      .execute();

    const pollId = pollResult[0].id;

    const input: GetPollInput = { id: pollId };
    const result = await getPoll(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(pollId);
    expect(result!.title).toBe('Poll Without Options');
    expect(result!.description).toBeNull();
    expect(result!.created_by).toBe(userId);
    expect(result!.is_active).toBe(false);
    expect(result!.options).toHaveLength(0);
    expect(result!.total_votes).toBe(0);
  });

  it('should calculate total votes correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'voteuser',
        email: 'vote@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test poll
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Vote Count Test',
        description: 'Testing vote counting',
        created_by: userId,
        is_active: true
      })
      .returning()
      .execute();

    const pollId = pollResult[0].id;

    // Create poll options with different vote counts
    await db.insert(pollOptionsTable)
      .values([
        {
          poll_id: pollId,
          option_text: 'High votes',
          vote_count: 15
        },
        {
          poll_id: pollId,
          option_text: 'Low votes',
          vote_count: 2
        },
        {
          poll_id: pollId,
          option_text: 'No votes',
          vote_count: 0
        }
      ])
      .execute();

    const input: GetPollInput = { id: pollId };
    const result = await getPoll(input);

    expect(result).not.toBeNull();
    expect(result!.options).toHaveLength(3);
    expect(result!.total_votes).toBe(17); // 15 + 2 + 0 = 17
  });
});
