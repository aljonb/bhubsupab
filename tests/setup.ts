import { beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http } from 'msw';

// Mock Supabase responses
const server = setupServer(
  // Add handlers as needed for testing
  http.post('https://your-project.supabase.co/auth/v1/token', () => {
    return new Response(JSON.stringify({ access_token: 'mock-token', user: { id: '123' } }));
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
