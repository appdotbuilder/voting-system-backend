
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, pollsTable } from '../db/schema';
import { type UpdatePollInput } from '../schema';
import { updatePoll } from '../handlers/update_poll';
import { eq } from 'drizzle-orm';

describe('updatePoll', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testPollId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test poll
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        created_by: testUserId,
        is_active: true
      })
      .returning()
      .execute();
    testPollId = pollResult[0].id;
  });

  it('should update poll title', async () => {
    const input: UpdatePollInput = {
      id: testPollId,
      title: 'Updated Title'
    };

    const result = await updatePoll(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual('Original description'); // Unchanged
    expect(result!.is_active).toBe(true); // Unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update poll description', async () => {
    const input: UpdatePollInput = {
      id: testPollId,
      description: 'Updated description'
    };

    const result = await updatePoll(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Original Title'); // Unchanged
    expect(result!.description).toEqual('Updated description');
    expect(result!.is_active).toBe(true); // Unchanged
  });

  it('should update poll active status', async () => {
    const input: UpdatePollInput = {
      id: testPollId,
      is_active: false
    };

    const result = await updatePoll(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Original Title'); // Unchanged
    expect(result!.description).toEqual('Original description'); // Unchanged
    expect(result!.is_active).toBe(false);
  });

  it('should update multiple fields at once', async () => {
    const input: UpdatePollInput = {
      id: testPollId,
      title: 'New Title',
      description: 'New description',
      is_active: false
    };

    const result = await updatePoll(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('New Title');
    expect(result!.description).toEqual('New description');
    expect(result!.is_active).toBe(false);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    const input: UpdatePollInput = {
      id: testPollId,
      description: null
    };

    const result = await updatePoll(input);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
  });

  it('should update the updated_at timestamp', async () => {
    // Get original timestamp
    const originalPoll = await db.select()
      .from(pollsTable)
      .where(eq(pollsTable.id, testPollId))
      .execute();
    const originalTimestamp = originalPoll[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdatePollInput = {
      id: testPollId,
      title: 'Updated Title'
    };

    const result = await updatePoll(input);

    expect(result).not.toBeNull();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });

  it('should persist changes to database', async () => {
    const input: UpdatePollInput = {
      id: testPollId,
      title: 'Database Test Title',
      is_active: false
    };

    await updatePoll(input);

    // Verify changes in database
    const polls = await db.select()
      .from(pollsTable)
      .where(eq(pollsTable.id, testPollId))
      .execute();

    expect(polls).toHaveLength(1);
    expect(polls[0].title).toEqual('Database Test Title');
    expect(polls[0].is_active).toBe(false);
  });

  it('should return null for non-existent poll', async () => {
    const input: UpdatePollInput = {
      id: 99999,
      title: 'This will not work'
    };

    const result = await updatePoll(input);

    expect(result).toBeNull();
  });

  it('should preserve other poll fields', async () => {
    const input: UpdatePollInput = {
      id: testPollId,
      title: 'Only Title Changed'
    };

    const result = await updatePoll(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testPollId);
    expect(result!.created_by).toEqual(testUserId);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.title).toEqual('Only Title Changed');
    expect(result!.description).toEqual('Original description');
    expect(result!.is_active).toBe(true);
  });
});
