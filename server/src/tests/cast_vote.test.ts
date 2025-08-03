
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, pollsTable, pollOptionsTable, votesTable } from '../db/schema';
import { type CastVoteInput } from '../schema';
import { castVote } from '../handlers/cast_vote';
import { eq, and } from 'drizzle-orm';

describe('castVote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should cast a vote successfully', async () => {
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
        description: 'Test description',
        created_by: userId,
        is_active: true
      })
      .returning()
      .execute();

    const pollId = pollResult[0].id;

    // Create test options
    const optionResult = await db.insert(pollOptionsTable)
      .values([
        {
          poll_id: pollId,
          option_text: 'Option 1',
          vote_count: 0
        },
        {
          poll_id: pollId,
          option_text: 'Option 2',
          vote_count: 0
        }
      ])
      .returning()
      .execute();

    const optionId = optionResult[0].id;

    const input: CastVoteInput = {
      poll_id: pollId,
      option_id: optionId,
      user_id: userId
    };

    const result = await castVote(input);

    // Verify vote record
    expect(result.poll_id).toEqual(pollId);
    expect(result.option_id).toEqual(optionId);
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify vote was saved to database
    const votes = await db.select()
      .from(votesTable)
      .where(eq(votesTable.id, result.id))
      .execute();

    expect(votes).toHaveLength(1);
    expect(votes[0].poll_id).toEqual(pollId);
    expect(votes[0].option_id).toEqual(optionId);
    expect(votes[0].user_id).toEqual(userId);

    // Verify vote count was incremented
    const options = await db.select()
      .from(pollOptionsTable)
      .where(eq(pollOptionsTable.id, optionId))
      .execute();

    expect(options[0].vote_count).toEqual(1);
  });

  it('should throw error if user does not exist', async () => {
    // Create test user for poll creator
    const userResult = await db.insert(usersTable)
      .values({
        username: 'creator',
        email: 'creator@example.com'
      })
      .returning()
      .execute();

    const creatorId = userResult[0].id;

    // Create test poll
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Test Poll',
        description: 'Test description',
        created_by: creatorId,
        is_active: true
      })
      .returning()
      .execute();

    const pollId = pollResult[0].id;

    // Create test option
    const optionResult = await db.insert(pollOptionsTable)
      .values({
        poll_id: pollId,
        option_text: 'Option 1',
        vote_count: 0
      })
      .returning()
      .execute();

    const optionId = optionResult[0].id;

    const input: CastVoteInput = {
      poll_id: pollId,
      option_id: optionId,
      user_id: 99999 // Non-existent user
    };

    await expect(castVote(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error if poll does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const input: CastVoteInput = {
      poll_id: 99999, // Non-existent poll
      option_id: 1,
      user_id: userId
    };

    await expect(castVote(input)).rejects.toThrow(/poll not found/i);
  });

  it('should throw error if poll is not active', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create inactive poll
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Inactive Poll',
        description: 'Test description',
        created_by: userId,
        is_active: false
      })
      .returning()
      .execute();

    const pollId = pollResult[0].id;

    // Create test option
    const optionResult = await db.insert(pollOptionsTable)
      .values({
        poll_id: pollId,
        option_text: 'Option 1',
        vote_count: 0
      })
      .returning()
      .execute();

    const optionId = optionResult[0].id;

    const input: CastVoteInput = {
      poll_id: pollId,
      option_id: optionId,
      user_id: userId
    };

    await expect(castVote(input)).rejects.toThrow(/poll is not active/i);
  });

  it('should throw error if option does not belong to poll', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create two polls
    const pollResults = await db.insert(pollsTable)
      .values([
        {
          title: 'Poll 1',
          description: 'First poll',
          created_by: userId,
          is_active: true
        },
        {
          title: 'Poll 2',
          description: 'Second poll',
          created_by: userId,
          is_active: true
        }
      ])
      .returning()
      .execute();

    const poll1Id = pollResults[0].id;
    const poll2Id = pollResults[1].id;

    // Create option for poll 2
    const optionResult = await db.insert(pollOptionsTable)
      .values({
        poll_id: poll2Id,
        option_text: 'Option for Poll 2',
        vote_count: 0
      })
      .returning()
      .execute();

    const optionId = optionResult[0].id;

    // Try to vote for poll 1 with option from poll 2
    const input: CastVoteInput = {
      poll_id: poll1Id,
      option_id: optionId,
      user_id: userId
    };

    await expect(castVote(input)).rejects.toThrow(/option not found for this poll/i);
  });

  it('should throw error if user has already voted on poll', async () => {
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
        description: 'Test description',
        created_by: userId,
        is_active: true
      })
      .returning()
      .execute();

    const pollId = pollResult[0].id;

    // Create test options
    const optionResults = await db.insert(pollOptionsTable)
      .values([
        {
          poll_id: pollId,
          option_text: 'Option 1',
          vote_count: 0
        },
        {
          poll_id: pollId,
          option_text: 'Option 2',
          vote_count: 0
        }
      ])
      .returning()
      .execute();

    const option1Id = optionResults[0].id;
    const option2Id = optionResults[1].id;

    // Cast first vote
    const firstInput: CastVoteInput = {
      poll_id: pollId,
      option_id: option1Id,
      user_id: userId
    };

    await castVote(firstInput);

    // Try to cast second vote on same poll
    const secondInput: CastVoteInput = {
      poll_id: pollId,
      option_id: option2Id,
      user_id: userId
    };

    await expect(castVote(secondInput)).rejects.toThrow(/user has already voted on this poll/i);
  });

  it('should increment vote count correctly', async () => {
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
        description: 'Test description',
        created_by: userId,
        is_active: true
      })
      .returning()
      .execute();

    const pollId = pollResult[0].id;

    // Create test option with initial vote count of 5
    const optionResult = await db.insert(pollOptionsTable)
      .values({
        poll_id: pollId,
        option_text: 'Option 1',
        vote_count: 5
      })
      .returning()
      .execute();

    const optionId = optionResult[0].id;

    const input: CastVoteInput = {
      poll_id: pollId,
      option_id: optionId,
      user_id: userId
    };

    await castVote(input);

    // Verify vote count increased from 5 to 6
    const options = await db.select()
      .from(pollOptionsTable)
      .where(eq(pollOptionsTable.id, optionId))
      .execute();

    expect(options[0].vote_count).toEqual(6);
  });
});
