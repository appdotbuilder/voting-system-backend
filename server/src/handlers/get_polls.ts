
import { db } from '../db';
import { pollsTable } from '../db/schema';
import { type Poll } from '../schema';

export const getPolls = async (): Promise<Poll[]> => {
  try {
    const results = await db.select()
      .from(pollsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch polls:', error);
    throw error;
  }
};
