
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, pollsTable } from '../db/schema';
import { getActivePolls } from '../handlers/get_active_polls';

describe('getActivePolls', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return only active polls', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create active and inactive polls
    await db.insert(pollsTable)
      .values([
        {
          title: 'Active Poll 1',
          description: 'First active poll',
          created_by: userId,
          is_active: true
        },
        {
          title: 'Active Poll 2',
          description: 'Second active poll',
          created_by: userId,
          is_active: true
        },
        {
          title: 'Inactive Poll',
          description: 'This poll is inactive',
          created_by: userId,
          is_active: false
        }
      ])
      .execute();

    const result = await getActivePolls();

    // Should only return the 2 active polls
    expect(result).toHaveLength(2);
    expect(result.every(poll => poll.is_active === true)).toBe(true);
    expect(result.some(poll => poll.title === 'Active Poll 1')).toBe(true);
    expect(result.some(poll => poll.title === 'Active Poll 2')).toBe(true);
    expect(result.some(poll => poll.title === 'Inactive Poll')).toBe(false);
  });

  it('should return empty array when no active polls exist', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create only inactive polls
    await db.insert(pollsTable)
      .values([
        {
          title: 'Inactive Poll 1',
          description: 'First inactive poll',
          created_by: userId,
          is_active: false
        },
        {
          title: 'Inactive Poll 2',
          description: 'Second inactive poll',
          created_by: userId,
          is_active: false
        }
      ])
      .execute();

    const result = await getActivePolls();

    expect(result).toHaveLength(0);
  });

  it('should return polls with correct structure and types', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create an active poll
    await db.insert(pollsTable)
      .values({
        title: 'Test Poll',
        description: 'A test poll',
        created_by: userId,
        is_active: true
      })
      .execute();

    const result = await getActivePolls();

    expect(result).toHaveLength(1);
    const poll = result[0];

    // Verify all required fields exist and have correct types
    expect(typeof poll.id).toBe('number');
    expect(typeof poll.title).toBe('string');
    expect(poll.title).toBe('Test Poll');
    expect(poll.description).toBe('A test poll');
    expect(typeof poll.created_by).toBe('number');
    expect(poll.created_by).toBe(userId);
    expect(typeof poll.is_active).toBe('boolean');
    expect(poll.is_active).toBe(true);
    expect(poll.created_at).toBeInstanceOf(Date);
    expect(poll.updated_at).toBeInstanceOf(Date);
  });
});
