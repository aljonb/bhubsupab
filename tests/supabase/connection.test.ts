import { describe, it, expect, vi } from 'vitest';
import { createClient } from '@/utils/supabase/client';

// Mock the Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [{ id: 1, title: 'Test note' }], error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ 
        data: { user: { id: '123', email: 'test@example.com' } }, 
        error: null 
      }),
    },
  })),
}));

describe('Supabase Connection', () => {
  it('should successfully create a client', () => {
    const client = createClient();
    expect(client).toBeDefined();
    expect(createClient).toHaveBeenCalled();
  });

  it('should be able to query data', async () => {
    const client = createClient();
    const { data, error } = await client.from('notes').select();
    
    expect(error).toBeNull();
    expect(data).toEqual([{ id: 1, title: 'Test note' }]);
  });

  it('should be able to get user data', async () => {
    const client = createClient();
    const { data, error } = await client.auth.getUser();
    
    expect(error).toBeNull();
    expect(data.user).toEqual({ id: '123', email: 'test@example.com' });
  });
});
