import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDatabaseClient, getDatabaseClient, setTenantContext, testConnection } from '../client';

// Mock Supabase
const mockSupabaseClient = {
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe('Database Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the singleton
    (global as any).supabaseClient = null;
  });

  describe('createDatabaseClient', () => {
    it('should create a new client with correct config', () => {
      const config = {
        url: 'https://test.supabase.co',
        serviceRoleKey: 'test-key',
      };

      const client = createDatabaseClient(config);
      expect(client).toBeDefined();
      expect(client).toBe(mockSupabaseClient);
    });

    it('should return the same client on subsequent calls (singleton)', () => {
      const config = {
        url: 'https://test.supabase.co',
        serviceRoleKey: 'test-key',
      };

      const client1 = createDatabaseClient(config);
      const client2 = createDatabaseClient(config);
      expect(client1).toBe(client2);
    });
  });

  describe('getDatabaseClient', () => {
    it('should throw error if client not initialized', () => {
      expect(() => getDatabaseClient()).toThrow('Database client not initialized');
    });

    it('should return client if initialized', () => {
      const config = {
        url: 'https://test.supabase.co',
        serviceRoleKey: 'test-key',
      };

      createDatabaseClient(config);
      const client = getDatabaseClient();
      expect(client).toBe(mockSupabaseClient);
    });
  });

  describe('setTenantContext', () => {
    beforeEach(() => {
      const config = {
        url: 'https://test.supabase.co',
        serviceRoleKey: 'test-key',
      };
      createDatabaseClient(config);
    });

    it('should set tenant context successfully', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ error: null });
      
      await setTenantContext('test-tenant-id');
      
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('set_config', {
        setting_name: 'app.current_tenant_id',
        setting_value: 'test-tenant-id',
        is_local: true,
      });
    });

    it('should throw error if RPC fails', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ 
        error: { message: 'RPC failed' } 
      });
      
      await expect(setTenantContext('test-tenant-id'))
        .rejects.toThrow('Failed to set tenant context: RPC failed');
    });
  });

  describe('testConnection', () => {
    beforeEach(() => {
      const config = {
        url: 'https://test.supabase.co',
        serviceRoleKey: 'test-key',
      };
      createDatabaseClient(config);
    });

    it('should return true for successful connection', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);
      
      const result = await testConnection();
      expect(result).toBe(true);
    });

    it('should return false for failed connection', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ error: { message: 'Connection failed' } }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);
      
      const result = await testConnection();
      expect(result).toBe(false);
    });

    it('should return false if query throws', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Network error');
      });
      
      const result = await testConnection();
      expect(result).toBe(false);
    });
  });
});
