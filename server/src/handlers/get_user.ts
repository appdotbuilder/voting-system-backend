
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetUserInput, type User } from '../schema';

export const getUser = async (input: GetUserInput): Promise<User | null> => {
  try {
    const results = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('User retrieval failed:', error);
    throw error;
  }
};
