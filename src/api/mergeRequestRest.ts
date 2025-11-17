/**
 * REST API fallbacks for Merge Request data
 */
import { restRequest, restPaginate, RestRequestOptions } from './rest.js';
import type { Diff, ApprovalInfo, User, MergeRequest } from '../types/index.js';

/**
 * Get merge request changes (diffs) via REST API
 */
export async function getMRChangesRest(
  projectId: string | number,
  iid: string | number,
  options: RestRequestOptions = {}
): Promise<{ changes: Diff[] }> {
  const path = `/projects/${encodeURIComponent(projectId)}/merge_requests/${iid}/changes`;
  return restRequest<{ changes: Diff[] }>(path, options);
}

/**
 * Get merge request approvals via REST API
 */
export async function getMRApprovalsRest(
  projectId: string | number,
  iid: string | number,
  options: RestRequestOptions = {}
): Promise<ApprovalInfo> {
  const path = `/projects/${encodeURIComponent(projectId)}/merge_requests/${iid}/approvals`;
  const data = await restRequest<{
    approved: boolean;
    approved_by: Array<{
      user: User;
    }>;
    approvals_required: number;
    approvals_left: number;
  }>(path, options);

  return {
    approved: data.approved,
    approvedBy: data.approved_by.map((item) => item.user),
    approvalsRequired: data.approvals_required,
    approvalsLeft: data.approvals_left,
  };
}

export interface GetMRsByUserOptions extends RestRequestOptions {
  projectPath?: string;
  state?: 'opened' | 'closed' | 'locked' | 'merged';
  scope?: 'all' | 'assigned_to_me' | 'created_by_me';
}

/**
 * Get all merge requests for a given username via REST API
 * Supports filtering by project and state
 */
export async function getMRsByUsername(
  username: string,
  options: GetMRsByUserOptions = {}
): Promise<MergeRequest[]> {
  const { projectPath, state, scope, ...restOptions } = options;

  let path: string;
  if (projectPath) {
    // Project-scoped: /projects/{id}/merge_requests?author_username={username}
    path = `/projects/${encodeURIComponent(projectPath)}/merge_requests?author_username=${encodeURIComponent(username)}`;
  } else {
    // Global: /merge_requests?author_username={username}
    path = `/merge_requests?author_username=${encodeURIComponent(username)}`;
  }

  // Add state filter if provided
  if (state) {
    path += `&state=${state}`;
  }

  // Add scope filter if provided
  if (scope) {
    path += `&scope=${scope}`;
  }

  // Use pagination to get all results
  const mrs = await restPaginate<{
    id: number;
    iid: number;
    title: string;
    description: string | null;
    state: string;
    author: {
      id: number;
      username: string;
      name: string;
      avatar_url: string | null;
      web_url: string;
    };
    assignees: Array<{
      id: number;
      username: string;
      name: string;
      avatar_url: string | null;
      web_url: string;
    }>;
    reviewers: Array<{
      id: number;
      username: string;
      name: string;
      avatar_url: string | null;
      web_url: string;
    }>;
    labels: string[];
    source_branch: string;
    target_branch: string;
    web_url: string;
    created_at: string;
    updated_at: string;
    merged_at: string | null;
    changes_count?: string;
  }>(path, restOptions);

  // Normalize REST API response to MergeRequest type
  return mrs.map((mr) => ({
    id: String(mr.id),
    iid: String(mr.iid),
    title: mr.title,
    description: mr.description || undefined,
    state: mr.state,
    author: {
      id: String(mr.author.id),
      username: mr.author.username,
      name: mr.author.name,
      avatarUrl: mr.author.avatar_url || undefined,
      webUrl: mr.author.web_url,
    },
    assignees: mr.assignees.map((a) => ({
      id: String(a.id),
      username: a.username,
      name: a.name,
      avatarUrl: a.avatar_url || undefined,
      webUrl: a.web_url,
    })),
    reviewers: mr.reviewers.map((r) => ({
      id: String(r.id),
      username: r.username,
      name: r.name,
      avatarUrl: r.avatar_url || undefined,
      webUrl: r.web_url,
    })),
    labels: mr.labels,
    sourceBranch: mr.source_branch,
    targetBranch: mr.target_branch,
    webUrl: mr.web_url,
    createdAt: mr.created_at,
    updatedAt: mr.updated_at,
    mergedAt: mr.merged_at || undefined,
    changesCount: mr.changes_count,
  }));
}
