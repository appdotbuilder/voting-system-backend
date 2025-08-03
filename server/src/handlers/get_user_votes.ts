
import { db } from '../db';
import { votesTable } from '../db/schema';
import { type GetUserInput, type Vote } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserVotes = async (input: GetUserInput): Promise<Vote[]> => {
  try {
    const results = await db.select()
      .from(votesTable)
      .where(eq(votesTable.user_id, input.id))
      .execute();

    return results;
  } catch (error) {
    console.error('Get user votes failed:', error);
    throw error;
  }
};
