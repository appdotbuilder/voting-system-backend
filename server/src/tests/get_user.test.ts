
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type GetUserInput, type CreateUserInput } from '../schema';
import { getUser } from '../handlers/get_user';

// Test input for getting a user
const testGetInput: GetUserInput = {
  id: 1
};

// Test input for creating a user
const testCreateInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com'
};

describe('getUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user when user exists', async () => {
    // First create a user
    const createdUser = await db.insert(usersTable)
      .values({
        username: testCreateInput.username,
        email: testCreateInput.email
      })
      .returning()
      .execute();

    const userId = createdUser[0].id;

    // Now get the user
    const result = await getUser({ id: userId });

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(userId);
    expect(result!.username).toEqual('testuser');
    expect(result!.email).toEqual('test@example.com');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when user does not exist', async () => {
    const result = await getUser({ id: 999 });

    expect(result).toBeNull();
  });

  it('should return correct user when multiple users exist', async () => {
    // Create multiple users
    const user1 = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com'
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com'
      })
      .returning()
      .execute();

    // Get the second user
    const result = await getUser({ id: user2[0].id });

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(user2[0].id);
    expect(result!.username).toEqual('user2');
    expect(result!.email).toEqual('user2@example.com');
    expect(result!.created_at).toBeInstanceOf(Date);
  });
});
