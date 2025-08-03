
import { db } from '../db';
import { pollsTable } from '../db/schema';
import { type UpdatePollInput, type Poll } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePoll = async (input: UpdatePollInput): Promise<Poll | null> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<{
      title: string;
      description: string | null;
      is_active: boolean;
      updated_at: Date;
    }> = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Update the poll
    const result = await db.update(pollsTable)
      .set(updateData)
      .where(eq(pollsTable.id, input.id))
      .returning()
      .execute();

    // Return the updated poll or null if not found
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Poll update failed:', error);
    throw error;
  }
};
