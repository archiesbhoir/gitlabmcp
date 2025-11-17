/**
 * End-to-end tests with real GitLab API
 * These tests require GITLAB_BASE_URL and GITLAB_TOKEN to be set
 * Skip if not available (useful for CI environments)
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { healthCheck } from '../health.js';
import { getMergeRequestView } from '../mergeRequestView.js';
import { getMergeRequest } from '../mergeRequest.js';
import { fetchAllCommits, fetchAllDiscussions } from '../pagination.js';
import { loadConfig } from '../../utils/config.js';

// Skip e2e tests if credentials are not available
const shouldSkipE2E =
  !process.env.GITLAB_BASE_URL ||
  !process.env.GITLAB_TOKEN ||
  !process.env.E2E_TEST_PROJECT_PATH ||
  !process.env.E2E_TEST_MR_IID;

describe.skipIf(shouldSkipE2E)('E2E Tests - Real GitLab API', () => {
  let testProjectPath: string;
  let testMRIid: string;

  beforeAll(() => {
    try {
      loadConfig(); // Validate config is available
      // Require these to be set for e2e tests
      testProjectPath = process.env.E2E_TEST_PROJECT_PATH!;
      testMRIid = process.env.E2E_TEST_MR_IID!;

      if (!testProjectPath || !testMRIid) {
        throw new Error(
          'E2E tests require E2E_TEST_PROJECT_PATH and E2E_TEST_MR_IID environment variables'
        );
      }
    } catch (error) {
      throw new Error(
        'E2E tests require GITLAB_BASE_URL, GITLAB_TOKEN, E2E_TEST_PROJECT_PATH, and E2E_TEST_MR_IID environment variables'
      );
    }
  });

  it('should perform health check', async () => {
    const health = await healthCheck();

    expect(health).toHaveProperty('version');
    expect(health).toHaveProperty('reachable');
    expect(health.reachable).toBe(true);
    expect(health.version).toBeTruthy();
  }, 30000); // 30 second timeout

  it('should fetch a merge request via GraphQL', async () => {
    const data = await getMergeRequest(testProjectPath, testMRIid, {
      commitsFirst: 10,
      discussionsFirst: 10,
    });

    expect(data).toBeDefined();
    expect(data.project).toBeDefined();
    expect(data.project?.mergeRequest).toBeDefined();
    expect(data.project?.mergeRequest?.iid).toBe(testMRIid);
    expect(data.project?.mergeRequest?.title).toBeTruthy();
  }, 30000); // 30 second timeout

  it('should fetch normalized merge request view', async () => {
    const view = await getMergeRequestView(testProjectPath, testMRIid, {
      forceRefresh: true,
    });

    expect(view).toBeDefined();
    expect(view.iid).toBe(testMRIid);
    expect(view.title).toBeTruthy();
    expect(view.author).toBeDefined();
    expect(view.author.username).toBeTruthy();
    expect(Array.isArray(view.commits)).toBe(true);
    expect(Array.isArray(view.pipelines)).toBe(true);
    expect(Array.isArray(view.diffs)).toBe(true);
    expect(Array.isArray(view.discussions)).toBe(true);
    expect(view.approvals).toBeDefined();
    expect(typeof view.approvals.approved).toBe('boolean');
  }, 30000); // 30 second timeout

  it('should fetch commits with pagination', async () => {
    const commits = await fetchAllCommits(testProjectPath, testMRIid, {
      commitsFirst: 5, // Small page size to test pagination
    });

    expect(Array.isArray(commits)).toBe(true);
    if (commits.length > 0) {
      const commit = commits[0];
      expect(commit).toHaveProperty('sha');
      expect(commit).toHaveProperty('title');
      expect(commit).toHaveProperty('authorName');
      expect(commit).toHaveProperty('webUrl');
    }
  }, 30000); // 30 second timeout

  it('should fetch discussions with pagination', async () => {
    const discussions = await fetchAllDiscussions(testProjectPath, testMRIid, {
      discussionsFirst: 5, // Small page size to test pagination
    });

    expect(Array.isArray(discussions)).toBe(true);
    if (discussions.length > 0) {
      const discussion = discussions[0];
      expect(discussion).toHaveProperty('id');
      expect(discussion).toHaveProperty('notes');
      expect(Array.isArray(discussion.notes)).toBe(true);
    }
  }, 30000); // 30 second timeout

  it('should handle cache correctly', async () => {
    // First fetch - should hit API
    const view1 = await getMergeRequestView(testProjectPath, testMRIid, {
      forceRefresh: true,
    });

    // Second fetch - should hit cache
    const view2 = await getMergeRequestView(testProjectPath, testMRIid, {
      forceRefresh: false,
    });

    expect(view1.iid).toBe(view2.iid);
    expect(view1.title).toBe(view2.title);
  }, 30000); // 30 second timeout

  it('should handle non-existent merge request', async () => {
    await expect(
      getMergeRequestView(testProjectPath, '999999', { forceRefresh: true })
    ).rejects.toThrow();
  }, 30000); // 30 second timeout
});
