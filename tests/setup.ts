import { beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock Supabase responses
const server = setupServer(
  // Add handlers as needed for testing
  rest.post('https://your-project.supabase.co/auth/v1/token', (req, res, ctx) => {
    return res(ctx.json({ access_token: 'mock-token', user: { id: '123' } }))
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
