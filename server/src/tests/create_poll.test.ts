
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, pollsTable, pollOptionsTable } from '../db/schema';
import { type CreatePollInput } from '../schema';
import { createPoll } from '../handlers/create_poll';
import { eq } from 'drizzle-orm';

describe('createPoll', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

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
  });

  const testInput: CreatePollInput = {
    title: 'Test Poll',
    description: 'A poll for testing',
    created_by: 0, // Will be set to testUserId in tests
    options: ['Option 1', 'Option 2', 'Option 3']
  };

  it('should create a poll with options', async () => {
    const input = { ...testInput, created_by: testUserId };
    const result = await createPoll(input);

    // Basic field validation
    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Test Poll');
    expect(result.description).toEqual('A poll for testing');
    expect(result.created_by).toEqual(testUserId);
    expect(result.is_active).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.total_votes).toEqual(0);

    // Options validation
    expect(result.options).toHaveLength(3);
    expect(result.options[0].option_text).toEqual('Option 1');
    expect(result.options[1].option_text).toEqual('Option 2');
    expect(result.options[2].option_text).toEqual('Option 3');
    
    result.options.forEach(option => {
      expect(option.id).toBeDefined();
      expect(option.poll_id).toEqual(result.id);
      expect(option.vote_count).toEqual(0);
      expect(option.created_at).toBeInstanceOf(Date);
    });
  });

  it('should save poll and options to database', async () => {
    const input = { ...testInput, created_by: testUserId };
    const result = await createPoll(input);

    // Check poll in database
    const polls = await db.select()
      .from(pollsTable)
      .where(eq(pollsTable.id, result.id))
      .execute();

    expect(polls).toHaveLength(1);
    expect(polls[0].title).toEqual('Test Poll');
    expect(polls[0].description).toEqual('A poll for testing');
    expect(polls[0].created_by).toEqual(testUserId);
    expect(polls[0].is_active).toBe(true);

    // Check options in database
    const options = await db.select()
      .from(pollOptionsTable)
      .where(eq(pollOptionsTable.poll_id, result.id))
      .execute();

    expect(options).toHaveLength(3);
    expect(options.map(o => o.option_text)).toEqual(['Option 1', 'Option 2', 'Option 3']);
    options.forEach(option => {
      expect(option.poll_id).toEqual(result.id);
      expect(option.vote_count).toEqual(0);
    });
  });

  it('should create poll with null description', async () => {
    const input = { ...testInput, description: null, created_by: testUserId };
    const result = await createPoll(input);

    expect(result.description).toBeNull();

    // Verify in database
    const polls = await db.select()
      .from(pollsTable)
      .where(eq(pollsTable.id, result.id))
      .execute();

    expect(polls[0].description).toBeNull();
  });

  it('should throw error for non-existent user', async () => {
    const input = { ...testInput, created_by: 99999 };
    
    await expect(createPoll(input)).rejects.toThrow(/user with id 99999 does not exist/i);
  });

  it('should handle minimum number of options', async () => {
    const input = { 
      ...testInput, 
      created_by: testUserId,
      options: ['Yes', 'No']
    };
    
    const result = await createPoll(input);

    expect(result.options).toHaveLength(2);
    expect(result.options[0].option_text).toEqual('Yes');
    expect(result.options[1].option_text).toEqual('No');
  });

  it('should handle maximum number of options', async () => {
    const input = { 
      ...testInput, 
      created_by: testUserId,
      options: Array.from({ length: 10 }, (_, i) => `Option ${i + 1}`)
    };
    
    const result = await createPoll(input);

    expect(result.options).toHaveLength(10);
    result.options.forEach((option, index) => {
      expect(option.option_text).toEqual(`Option ${index + 1}`);
    });
  });
});
