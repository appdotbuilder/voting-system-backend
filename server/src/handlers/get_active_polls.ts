
import { db } from '../db';
import { pollsTable } from '../db/schema';
import { type Poll } from '../schema';
import { eq } from 'drizzle-orm';

export const getActivePolls = async (): Promise<Poll[]> => {
  try {
    const results = await db.select()
      .from(pollsTable)
      .where(eq(pollsTable.is_active, true))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch active polls:', error);
    throw error;
  }
};
