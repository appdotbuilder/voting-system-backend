
import { db } from '../db';
import { pollsTable, pollOptionsTable, usersTable } from '../db/schema';
import { type CreatePollInput, type PollWithDetails } from '../schema';
import { eq } from 'drizzle-orm';

export const createPoll = async (input: CreatePollInput): Promise<PollWithDetails> => {
  try {
    // Verify that the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.created_by))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.created_by} does not exist`);
    }

    // Use transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // Create poll record
      const pollResult = await tx.insert(pollsTable)
        .values({
          title: input.title,
          description: input.description,
          created_by: input.created_by,
          is_active: true
        })
        .returning()
        .execute();

      const poll = pollResult[0];

      // Create poll option records
      const optionValues = input.options.map(optionText => ({
        poll_id: poll.id,
        option_text: optionText,
        vote_count: 0
      }));

      const optionsResult = await tx.insert(pollOptionsTable)
        .values(optionValues)
        .returning()
        .execute();

      return {
        poll,
        options: optionsResult
      };
    });

    // Return poll with options
    return {
      id: result.poll.id,
      title: result.poll.title,
      description: result.poll.description,
      created_by: result.poll.created_by,
      is_active: result.poll.is_active,
      created_at: result.poll.created_at,
      updated_at: result.poll.updated_at,
      options: result.options,
      total_votes: 0
    };
  } catch (error) {
    console.error('Poll creation failed:', error);
    throw error;
  }
};
