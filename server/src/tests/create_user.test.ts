
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testuser');
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should enforce unique username constraint', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same username but different email
    const duplicateUsernameInput: CreateUserInput = {
      username: 'testuser', // Same username
      email: 'different@example.com' // Different email
    };

    expect(createUser(duplicateUsernameInput)).rejects.toThrow(/unique/i);
  });

  it('should enforce unique email constraint', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same email but different username
    const duplicateEmailInput: CreateUserInput = {
      username: 'differentuser', // Different username
      email: 'test@example.com' // Same email
    };

    expect(createUser(duplicateEmailInput)).rejects.toThrow(/unique/i);
  });
});
