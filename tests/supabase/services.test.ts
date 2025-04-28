import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/utils/supabase/client';

// Mock the Supabase client
const mockSupabase = {
  from: vi.fn(),
  auth: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
};

vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

describe('Supabase Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Data operations', () => {
    it('should fetch data from a table', async () => {
      const mockSelect = vi.fn().mockResolvedValue({ 
        data: [{ id: 1, name: 'Test Item' }], 
        error: null 
      });
      
      mockSupabase.from.mockReturnValue({ select: mockSelect });
      
      const client = createClient();
      const { data, error } = await client.from('test_table').select();
      
      expect(mockSupabase.from).toHaveBeenCalledWith('test_table');
      expect(mockSelect).toHaveBeenCalled();
      expect(data).toEqual([{ id: 1, name: 'Test Item' }]);
      expect(error).toBeNull();
    });
  });
}); 