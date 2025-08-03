
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, pollsTable } from '../db/schema';
import { getPolls } from '../handlers/get_polls';

describe('getPolls', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no polls exist', async () => {
    const result = await getPolls();

    expect(result).toEqual([]);
  });

  it('should return all polls', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test polls
    await db.insert(pollsTable)
      .values([
        {
          title: 'First Poll',
          description: 'First poll description',
          created_by: userId,
          is_active: true
        },
        {
          title: 'Second Poll',
          description: null,
          created_by: userId,
          is_active: false
        }
      ])
      .execute();

    const result = await getPolls();

    expect(result).toHaveLength(2);
    
    // Check first poll
    expect(result[0].title).toEqual('First Poll');
    expect(result[0].description).toEqual('First poll description');
    expect(result[0].created_by).toEqual(userId);
    expect(result[0].is_active).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Check second poll
    expect(result[1].title).toEqual('Second Poll');
    expect(result[1].description).toBeNull();
    expect(result[1].created_by).toEqual(userId);
    expect(result[1].is_active).toBe(false);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should return polls in creation order', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create polls at different times to test ordering
    await db.insert(pollsTable)
      .values({
        title: 'Older Poll',
        description: 'Created first',
        created_by: userId
      })
      .execute();

    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(pollsTable)
      .values({
        title: 'Newer Poll',
        description: 'Created second',
        created_by: userId
      })
      .execute();

    const result = await getPolls();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Older Poll');
    expect(result[1].title).toEqual('Newer Poll');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
