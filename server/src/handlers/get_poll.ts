
import { db } from '../db';
import { pollsTable, pollOptionsTable } from '../db/schema';
import { type GetPollInput, type PollWithDetails } from '../schema';
import { eq } from 'drizzle-orm';

export const getPoll = async (input: GetPollInput): Promise<PollWithDetails | null> => {
  try {
    // Query poll with its options
    const results = await db.select()
      .from(pollsTable)
      .leftJoin(pollOptionsTable, eq(pollOptionsTable.poll_id, pollsTable.id))
      .where(eq(pollsTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Process results to build poll with details
    const pollData = results[0].polls;
    const options = results
      .filter(result => result.poll_options !== null)
      .map(result => result.poll_options!);

    // Calculate total votes from all options
    const total_votes = options.reduce((sum, option) => sum + option.vote_count, 0);

    return {
      id: pollData.id,
      title: pollData.title,
      description: pollData.description,
      created_by: pollData.created_by,
      is_active: pollData.is_active,
      created_at: pollData.created_at,
      updated_at: pollData.updated_at,
      options: options,
      total_votes: total_votes
    };
  } catch (error) {
    console.error('Get poll failed:', error);
    throw error;
  }
};
