
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createUserInputSchema,
  createPollInputSchema,
  castVoteInputSchema,
  updatePollInputSchema,
  getPollInputSchema,
  getUserInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUser } from './handlers/get_user';
import { getUsers } from './handlers/get_users';
import { createPoll } from './handlers/create_poll';
import { getPoll } from './handlers/get_poll';
import { getPolls } from './handlers/get_polls';
import { getActivePolls } from './handlers/get_active_polls';
import { updatePoll } from './handlers/update_poll';
import { castVote } from './handlers/cast_vote';
import { getUserVotes } from './handlers/get_user_votes';
import { deletePoll } from './handlers/delete_poll';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User operations
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUser: publicProcedure
    .input(getUserInputSchema)
    .query(({ input }) => getUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),

  // Poll operations
  createPoll: publicProcedure
    .input(createPollInputSchema)
    .mutation(({ input }) => createPoll(input)),
  
  getPoll: publicProcedure
    .input(getPollInputSchema)
    .query(({ input }) => getPoll(input)),
  
  getPolls: publicProcedure
    .query(() => getPolls()),
  
  getActivePolls: publicProcedure
    .query(() => getActivePolls()),
  
  updatePoll: publicProcedure
    .input(updatePollInputSchema)
    .mutation(({ input }) => updatePoll(input)),
  
  deletePoll: publicProcedure
    .input(getPollInputSchema)
    .mutation(({ input }) => deletePoll(input)),

  // Voting operations
  castVote: publicProcedure
    .input(castVoteInputSchema)
    .mutation(({ input }) => castVote(input)),
  
  getUserVotes: publicProcedure
    .input(getUserInputSchema)
    .query(({ input }) => getUserVotes(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
