/**
 * Unit tests for GraphQL client
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { graphqlRequest } from '../graphql.js';
import { GitLabErrorCode } from '../../utils/errors.js';

// Mock fetch
global.fetch = vi.fn();

describe('graphqlRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITLAB_BASE_URL = 'https://git.egnyte-internal.com';
    process.env.GITLAB_TOKEN = 'test-token';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should make a successful GraphQL request', async () => {
    const mockData = { data: { project: { id: '1' } } };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockData,
    });

    const result = await graphqlRequest('query { project { id } }');

    expect(result).toEqual(mockData.data);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://git.egnyte-internal.com/api/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'PRIVATE-TOKEN': 'test-token',
        }),
      })
    );
  });

  it('should handle GraphQL errors', async () => {
    const mockError = {
      data: null,
      errors: [{ message: 'Invalid query' }],
    };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockError,
    });

    await expect(graphqlRequest('query { invalid }', undefined, { retries: 0 })).rejects.toThrow();
  }, 10000);

  it('should handle 401 authentication errors', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers(),
    });

    await expect(graphqlRequest('query { project { id } }')).rejects.toMatchObject({
      code: GitLabErrorCode.GITLAB_AUTH_ERR,
    });
  });

  it('should handle 429 rate limit errors', async () => {
    const headers = new Headers();
    headers.set('Retry-After', '60');
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers,
    });

    await expect(
      graphqlRequest('query { project { id } }', undefined, { retries: 0 })
    ).rejects.toMatchObject({
      code: GitLabErrorCode.GITLAB_RATE_LIMIT,
      retryAfter: 60,
    });
  }, 10000);

  it('should retry on network errors', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { project: { id: '1' } } }),
      });

    const result = await graphqlRequest('query { project { id } }', {}, { retries: 1 });

    expect(result).toEqual({ project: { id: '1' } });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
