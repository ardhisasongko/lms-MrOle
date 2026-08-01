// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { onRequestGet } from './config';

describe('public app config API', () => {
  it('returns the public Supabase browser configuration', async () => {
    const response = await onRequestGet({
      env: {
        SUPABASE_URL: 'https://project.supabase.co',
        SUPABASE_ANON_KEY: 'anon-key',
      },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      supabaseUrl: 'https://project.supabase.co',
      supabaseAnonKey: 'anon-key',
    });
  });

  it('fails clearly when runtime configuration is missing', async () => {
    const response = await onRequestGet({ env: {} });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Public app configuration is missing' });
  });
});
