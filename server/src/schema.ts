
import { z } from 'zod';

// Poll schema
export const pollSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  created_by: z.number(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Poll = z.infer<typeof pollSchema>;

// Poll option schema
export const pollOptionSchema = z.object({
  id: z.number(),
  poll_id: z.number(),
  option_text: z.string(),
  vote_count: z.number().int(),
  created_at: z.coerce.date()
});

export type PollOption = z.infer<typeof pollOptionSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Vote schema
export const voteSchema = z.object({
  id: z.number(),
  poll_id: z.number(),
  option_id: z.number(),
  user_id: z.number(),
  created_at: z.coerce.date()
});

export type Vote = z.infer<typeof voteSchema>;

// Input schemas for creating entities
export const createUserInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createPollInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().nullable(),
  created_by: z.number(),
  options: z.array(z.string().min(1)).min(2).max(10) // At least 2 options, max 10
});

export type CreatePollInput = z.infer<typeof createPollInputSchema>;

export const castVoteInputSchema = z.object({
  poll_id: z.number(),
  option_id: z.number(),
  user_id: z.number()
});

export type CastVoteInput = z.infer<typeof castVoteInputSchema>;

// Update schemas
export const updatePollInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdatePollInput = z.infer<typeof updatePollInputSchema>;

// Query schemas
export const getPollInputSchema = z.object({
  id: z.number()
});

export type GetPollInput = z.infer<typeof getPollInputSchema>;

export const getUserInputSchema = z.object({
  id: z.number()
});

export type GetUserInput = z.infer<typeof getUserInputSchema>;

// Poll with options and votes (for detailed poll view)
export const pollWithDetailsSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  created_by: z.number(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  options: z.array(pollOptionSchema),
  total_votes: z.number().int()
});

export type PollWithDetails = z.infer<typeof pollWithDetailsSchema>;
