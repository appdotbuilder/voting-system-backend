
import { db } from '../db';
import { pollsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetPollInput } from '../schema';

export const deletePoll = async (input: GetPollInput): Promise<boolean> => {
  try {
    // Delete the poll - CASCADE will handle options and votes automatically
    const result = await db.delete(pollsTable)
      .where(eq(pollsTable.id, input.id))
      .returning()
      .execute();

    // Return true if a poll was deleted, false if none found
    return result.length > 0;
  } catch (error) {
    console.error('Poll deletion failed:', error);
    throw error;
  }
};
