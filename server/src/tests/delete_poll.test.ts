
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, pollsTable, pollOptionsTable, votesTable } from '../db/schema';
import { deletePoll } from '../handlers/delete_poll';
import { eq } from 'drizzle-orm';

describe('deletePoll', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a poll successfully', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create test poll
    const [poll] = await db.insert(pollsTable)
      .values({
        title: 'Test Poll',
        description: 'A test poll',
        created_by: user.id
      })
      .returning()
      .execute();

    // Delete the poll
    const result = await deletePoll({ id: poll.id });

    expect(result).toBe(true);

    // Verify poll is deleted
    const polls = await db.select()
      .from(pollsTable)
      .where(eq(pollsTable.id, poll.id))
      .execute();

    expect(polls).toHaveLength(0);
  });

  it('should return false when poll does not exist', async () => {
    const result = await deletePoll({ id: 999 });

    expect(result).toBe(false);
  });

  it('should delete poll with options and votes (cascade)', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create another user for voting
    const [voter] = await db.insert(usersTable)
      .values({
        username: 'voter',
        email: 'voter@example.com'
      })
      .returning()
      .execute();

    // Create test poll
    const [poll] = await db.insert(pollsTable)
      .values({
        title: 'Test Poll',
        description: 'A test poll',
        created_by: user.id
      })
      .returning()
      .execute();

    // Create poll options
    const [option1] = await db.insert(pollOptionsTable)
      .values({
        poll_id: poll.id,
        option_text: 'Option 1',
        vote_count: 1
      })
      .returning()
      .execute();

    const [option2] = await db.insert(pollOptionsTable)
      .values({
        poll_id: poll.id,
        option_text: 'Option 2',
        vote_count: 0
      })
      .returning()
      .execute();

    // Create a vote
    await db.insert(votesTable)
      .values({
        poll_id: poll.id,
        option_id: option1.id,
        user_id: voter.id
      })
      .execute();

    // Verify data exists before deletion
    const pollsBefore = await db.select().from(pollsTable).where(eq(pollsTable.id, poll.id)).execute();
    const optionsBefore = await db.select().from(pollOptionsTable).where(eq(pollOptionsTable.poll_id, poll.id)).execute();
    const votesBefore = await db.select().from(votesTable).where(eq(votesTable.poll_id, poll.id)).execute();

    expect(pollsBefore).toHaveLength(1);
    expect(optionsBefore).toHaveLength(2);
    expect(votesBefore).toHaveLength(1);

    // Delete the poll
    const result = await deletePoll({ id: poll.id });

    expect(result).toBe(true);

    // Verify all related data is deleted due to CASCADE
    const pollsAfter = await db.select().from(pollsTable).where(eq(pollsTable.id, poll.id)).execute();
    const optionsAfter = await db.select().from(pollOptionsTable).where(eq(pollOptionsTable.poll_id, poll.id)).execute();
    const votesAfter = await db.select().from(votesTable).where(eq(votesTable.poll_id, poll.id)).execute();

    expect(pollsAfter).toHaveLength(0);
    expect(optionsAfter).toHaveLength(0);
    expect(votesAfter).toHaveLength(0);

    // Verify users are not deleted
    const usersAfter = await db.select().from(usersTable).execute();
    expect(usersAfter).toHaveLength(2);
  });

  it('should handle multiple poll deletions correctly', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create two test polls
    const [poll1] = await db.insert(pollsTable)
      .values({
        title: 'Poll 1',
        description: 'First poll',
        created_by: user.id
      })
      .returning()
      .execute();

    const [poll2] = await db.insert(pollsTable)
      .values({
        title: 'Poll 2',
        description: 'Second poll',
        created_by: user.id
      })
      .returning()
      .execute();

    // Delete first poll
    const result1 = await deletePoll({ id: poll1.id });
    expect(result1).toBe(true);

    // Verify first poll is deleted, second still exists
    const poll1After = await db.select().from(pollsTable).where(eq(pollsTable.id, poll1.id)).execute();
    const poll2After = await db.select().from(pollsTable).where(eq(pollsTable.id, poll2.id)).execute();

    expect(poll1After).toHaveLength(0);
    expect(poll2After).toHaveLength(1);

    // Delete second poll
    const result2 = await deletePoll({ id: poll2.id });
    expect(result2).toBe(true);

    // Verify second poll is also deleted
    const poll2Final = await db.select().from(pollsTable).where(eq(pollsTable.id, poll2.id)).execute();
    expect(poll2Final).toHaveLength(0);
  });
});
