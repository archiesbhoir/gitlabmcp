import { describe, it, expect } from 'vitest';
import { normalizeMR } from '../normalize.js';
import { MRQueryResponse } from '../../queries/mergeRequest.js';

describe('normalizeMR', () => {
  it('should normalize GraphQL response to MergeRequestView', () => {
    const mockResponse: MRQueryResponse = {
      project: {
        id: '1',
        fullPath: 'group/project',
        name: 'project',
        webUrl: 'https://git.egnyte-internal.com/group/project',
        mergeRequest: {
          id: '2',
          iid: '123',
          title: 'Test MR',
          description: 'Test description',
          state: 'opened',
          sourceBranch: 'feature',
          targetBranch: 'main',
          webUrl: 'https://git.egnyte-internal.com/group/project/-/merge_requests/123',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          mergedAt: null,
          author: {
            id: '3',
            username: 'user',
            name: 'Test User',
            avatarUrl: 'https://example.com/avatar.png',
            webUrl: 'https://git.egnyte-internal.com/user',
          },
          assignees: {
            nodes: [],
          },
          reviewers: {
            nodes: [],
          },
          labels: {
            nodes: [{ title: 'bug' }],
          },
          commits: {
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
            nodes: [
              {
                id: '4',
                sha: 'abc123',
                title: 'Commit 1',
                message: 'Commit 1 message',
                authorName: 'User',
                authorEmail: 'user@example.com',
                authoredDate: '2024-01-01T00:00:00Z',
                committedDate: '2024-01-01T00:00:00Z',
                webUrl: 'https://git.egnyte-internal.com/group/project/-/commit/abc123',
              },
            ],
          },
          pipelines: {
            nodes: [
              {
                id: '5',
                status: 'success',
                ref: 'feature',
                sha: 'abc123',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T01:00:00Z',
                duration: 100,
              },
            ],
          },
          approved: false,
          discussions: {
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
            nodes: [],
          },
        },
      },
    };

    const result = normalizeMR(mockResponse);

    expect(result).toMatchObject({
      id: '2',
      iid: '123',
      title: 'Test MR',
      description: 'Test description',
      state: 'opened',
      labels: ['bug'],
      commits: expect.arrayContaining([
        expect.objectContaining({
          sha: 'abc123',
          title: 'Commit 1',
        }),
      ]),
      diffs: [], // Diffs not available in GraphQL, will be empty array
      pipelines: expect.arrayContaining([
        expect.objectContaining({
          status: 'success',
        }),
      ]),
      approvals: expect.objectContaining({
        approved: false,
        approvedBy: [],
        approvalsRequired: 0, // Not available in GraphQL
        approvalsLeft: 0, // Not available in GraphQL
      }),
    });
  });

  it('should throw error if project or mergeRequest is null', () => {
    const mockResponse: MRQueryResponse = {
      project: null,
    };

    expect(() => normalizeMR(mockResponse)).toThrow('Invalid MR data');
  });
});
