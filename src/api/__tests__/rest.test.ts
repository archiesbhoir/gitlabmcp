import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { restRequest, restPaginate } from '../rest.js';
import { GitLabErrorCode } from '../../utils/errors.js';

global.fetch = vi.fn();

describe('restRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITLAB_BASE_URL = 'https://git.egnyte-internal.com';
    process.env.GITLAB_TOKEN = 'test-token';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should make a successful REST request', async () => {
    const mockData = { id: 1, name: 'test' };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockData,
    });

    const result = await restRequest('/projects/1');

    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://git.egnyte-internal.com/api/v4/projects/1',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'PRIVATE-TOKEN': 'test-token',
        }),
      })
    );
  });

  it('should handle 404 not found errors', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: new Headers(),
    });

    await expect(restRequest('/projects/999')).rejects.toMatchObject({
      code: GitLabErrorCode.GITLAB_NOT_FOUND,
    });
  });
});

describe('restPaginate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITLAB_BASE_URL = 'https://git.egnyte-internal.com';
    process.env.GITLAB_TOKEN = 'test-token';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should paginate through all results', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [{ id: 1 }, { id: 2 }],
    });

    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    const result = await restPaginate('/projects/1/merge_requests', { perPage: 2 });

    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should handle multiple pages', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => Array.from({ length: 100 }, (_, i) => ({ id: i + 1 })),
    });

    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => Array.from({ length: 50 }, (_, i) => ({ id: i + 101 })),
    });

    const result = await restPaginate('/projects/1/merge_requests', { perPage: 100 });

    expect(result).toHaveLength(150);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
