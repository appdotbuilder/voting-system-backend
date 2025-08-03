
import { serial, text, pgTable, timestamp, integer, boolean, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Polls table
export const pollsTable = pgTable('polls', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default
  created_by: integer('created_by').notNull().references(() => usersTable.id),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Poll options table
export const pollOptionsTable = pgTable('poll_options', {
  id: serial('id').primaryKey(),
  poll_id: integer('poll_id').notNull().references(() => pollsTable.id, { onDelete: 'cascade' }),
  option_text: text('option_text').notNull(),
  vote_count: integer('vote_count').default(0).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Votes table - fixed to use unique constraint instead of composite primary key
export const votesTable = pgTable('votes', {
  id: serial('id').primaryKey(),
  poll_id: integer('poll_id').notNull().references(() => pollsTable.id, { onDelete: 'cascade' }),
  option_id: integer('option_id').notNull().references(() => pollOptionsTable.id, { onDelete: 'cascade' }),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  // Ensure one vote per user per poll using unique constraint
  userPollUnique: unique().on(table.poll_id, table.user_id)
}));

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  polls: many(pollsTable),
  votes: many(votesTable)
}));

export const pollsRelations = relations(pollsTable, ({ one, many }) => ({
  creator: one(usersTable, {
    fields: [pollsTable.created_by],
    references: [usersTable.id]
  }),
  options: many(pollOptionsTable),
  votes: many(votesTable)
}));

export const pollOptionsRelations = relations(pollOptionsTable, ({ one, many }) => ({
  poll: one(pollsTable, {
    fields: [pollOptionsTable.poll_id],
    references: [pollsTable.id]
  }),
  votes: many(votesTable)
}));

export const votesRelations = relations(votesTable, ({ one }) => ({
  poll: one(pollsTable, {
    fields: [votesTable.poll_id],
    references: [pollsTable.id]
  }),
  option: one(pollOptionsTable, {
    fields: [votesTable.option_id],
    references: [pollOptionsTable.id]
  }),
  user: one(usersTable, {
    fields: [votesTable.user_id],
    references: [usersTable.id]
  })
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Poll = typeof pollsTable.$inferSelect;
export type NewPoll = typeof pollsTable.$inferInsert;
export type PollOption = typeof pollOptionsTable.$inferSelect;
export type NewPollOption = typeof pollOptionsTable.$inferInsert;
export type Vote = typeof votesTable.$inferSelect;
export type NewVote = typeof votesTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  polls: pollsTable,
  pollOptions: pollOptionsTable,
  votes: votesTable
};
