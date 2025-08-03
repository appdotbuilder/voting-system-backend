
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users from database', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([
        {
          username: 'user1',
          email: 'user1@example.com'
        },
        {
          username: 'user2',
          email: 'user2@example.com'
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    expect(result[0].username).toEqual('user1');
    expect(result[0].email).toEqual('user1@example.com');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].username).toEqual('user2');
    expect(result[1].email).toEqual('user2@example.com');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return users ordered by creation', async () => {
    // Create users in sequence
    const user1 = await db.insert(usersTable)
      .values({
        username: 'first_user',
        email: 'first@example.com'
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({
        username: 'second_user',
        email: 'second@example.com'
      })
      .returning()
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    // Should maintain database order (typically by ID)
    expect(result[0].id).toBeLessThan(result[1].id);
  });
});
