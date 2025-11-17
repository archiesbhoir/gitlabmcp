/**
 * Unit tests for normalization layer
 */
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
          changesCount: '10',
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
          diffs: {
            nodes: [
              {
                oldPath: 'old.js',
                newPath: 'new.js',
                aMode: '100644',
                bMode: '100644',
                diff: '--- a/old.js\n+++ b/new.js',
                newFile: false,
                renamedFile: true,
                deletedFile: false,
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
                webUrl: 'https://git.egnyte-internal.com/group/project/-/pipelines/5',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T01:00:00Z',
                duration: 100,
              },
            ],
          },
          approvals: {
            approved: false,
            approvedBy: {
              nodes: [],
            },
            approvalsRequired: 2,
            approvalsLeft: 2,
          },
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
      diffs: expect.arrayContaining([
        expect.objectContaining({
          oldPath: 'old.js',
          newPath: 'new.js',
        }),
      ]),
      pipelines: expect.arrayContaining([
        expect.objectContaining({
          status: 'success',
        }),
      ]),
      approvals: expect.objectContaining({
        approved: false,
        approvalsRequired: 2,
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
