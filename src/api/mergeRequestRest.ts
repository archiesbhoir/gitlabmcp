import {
  restRequest,
  restPaginate,
  restPost,
  RestRequestOptions,
  RestPostOptions,
} from './rest.js';
import type { Diff, ApprovalInfo, User, MergeRequest } from '../types/index.js';

export async function getMRChangesRest(
  projectId: string | number,
  iid: string | number,
  options: RestRequestOptions = {}
): Promise<{ changes: Diff[] }> {
  const path = `/projects/${encodeURIComponent(projectId)}/merge_requests/${iid}/changes`;
  return restRequest<{ changes: Diff[] }>(path, options);
}

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

export async function getMRsByUsername(
  username: string,
  options: GetMRsByUserOptions = {}
): Promise<MergeRequest[]> {
  const { projectPath, state, scope, ...restOptions } = options;

  let path: string;
  if (projectPath) {
    path = `/projects/${encodeURIComponent(projectPath)}/merge_requests?author_username=${encodeURIComponent(username)}`;
  } else {
    path = `/merge_requests?author_username=${encodeURIComponent(username)}`;
  }

  if (state) {
    path += `&state=${state}`;
  }

  if (scope) {
    path += `&scope=${scope}`;
  }

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

export interface CreateMergeRequestOptions extends RestPostOptions {
  sourceBranch: string;
  targetBranch: string;
  title: string;
  description?: string;
  assigneeIds?: number[];
  reviewerIds?: number[];
  labels?: string[];
  removeSourceBranch?: boolean;
  squash?: boolean;
}

export async function createMergeRequest(
  projectPath: string,
  options: CreateMergeRequestOptions
): Promise<MergeRequest> {
  const {
    sourceBranch,
    targetBranch,
    title,
    description,
    assigneeIds,
    reviewerIds,
    labels,
    removeSourceBranch,
    squash,
    ...restOptions
  } = options;

  const path = `/projects/${encodeURIComponent(projectPath)}/merge_requests`;

  const body: Record<string, unknown> = {
    source_branch: sourceBranch,
    target_branch: targetBranch,
    title,
  };

  if (description !== undefined) {
    body.description = description;
  }
  if (assigneeIds && assigneeIds.length > 0) {
    body.assignee_ids = assigneeIds;
  }
  if (reviewerIds && reviewerIds.length > 0) {
    body.reviewer_ids = reviewerIds;
  }
  if (labels && labels.length > 0) {
    body.labels = labels.join(',');
  }
  if (removeSourceBranch !== undefined) {
    body.remove_source_branch = removeSourceBranch;
  }
  if (squash !== undefined) {
    body.squash = squash;
  }

  const mr = await restPost<{
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
  }>(path, {
    ...restOptions,
    body,
  });

  return {
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
  };
}
