
import { db } from '../db';
import { pollsTable, pollOptionsTable, usersTable, votesTable } from '../db/schema';
import { type CastVoteInput, type Vote } from '../schema';
import { eq, and } from 'drizzle-orm';

export const castVote = async (input: CastVoteInput): Promise<Vote> => {
  try {
    // Use transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // 1. Validate user exists
      const user = await tx.select()
        .from(usersTable)
        .where(eq(usersTable.id, input.user_id))
        .execute();

      if (user.length === 0) {
        throw new Error('User not found');
      }

      // 2. Validate poll exists and is active
      const poll = await tx.select()
        .from(pollsTable)
        .where(eq(pollsTable.id, input.poll_id))
        .execute();

      if (poll.length === 0) {
        throw new Error('Poll not found');
      }

      if (!poll[0].is_active) {
        throw new Error('Poll is not active');
      }

      // 3. Validate option belongs to poll
      const option = await tx.select()
        .from(pollOptionsTable)
        .where(and(
          eq(pollOptionsTable.id, input.option_id),
          eq(pollOptionsTable.poll_id, input.poll_id)
        ))
        .execute();

      if (option.length === 0) {
        throw new Error('Option not found for this poll');
      }

      // 4. Check if user has already voted on this poll
      const existingVote = await tx.select()
        .from(votesTable)
        .where(and(
          eq(votesTable.poll_id, input.poll_id),
          eq(votesTable.user_id, input.user_id)
        ))
        .execute();

      if (existingVote.length > 0) {
        throw new Error('User has already voted on this poll');
      }

      // 5. Create vote record
      const voteResult = await tx.insert(votesTable)
        .values({
          poll_id: input.poll_id,
          option_id: input.option_id,
          user_id: input.user_id
        })
        .returning()
        .execute();

      // 6. Increment vote count for the option
      await tx.update(pollOptionsTable)
        .set({
          vote_count: option[0].vote_count + 1
        })
        .where(eq(pollOptionsTable.id, input.option_id))
        .execute();

      return voteResult[0];
    });

    return result;
  } catch (error) {
    console.error('Vote casting failed:', error);
    throw error;
  }
};
