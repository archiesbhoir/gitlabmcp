/**
 * REST API fallbacks for Merge Request data
 */
import { restRequest, restPaginate, RestRequestOptions } from './rest.js';
import type { MergeRequest, Commit, Diff, ApprovalInfo, Pipeline, User } from '../types/index.js';

export interface GetMRRestOptions extends RestRequestOptions {
  includeChanges?: boolean;
  includeCommits?: boolean;
  includeApprovals?: boolean;
  includePipelines?: boolean;
}

/**
 * Get merge request via REST API
 */
export async function getMRRest(
  projectId: string | number,
  iid: string | number,
  options: GetMRRestOptions = {}
): Promise<MergeRequest> {
  const path = `/projects/${encodeURIComponent(projectId)}/merge_requests/${iid}`;
  return restRequest<MergeRequest>(path, options);
}

/**
 * Get merge request commits via REST API
 */
export async function getMRCommitsRest(
  projectId: string | number,
  iid: string | number,
  options: RestRequestOptions = {}
): Promise<Commit[]> {
  const path = `/projects/${encodeURIComponent(projectId)}/merge_requests/${iid}/commits`;
  return restPaginate<Commit>(path, options);
}

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

/**
 * Get pipelines for a specific SHA via REST API
 */
export async function getMRPipelinesRest(
  projectId: string | number,
  sha: string,
  options: RestRequestOptions = {}
): Promise<Pipeline[]> {
  const path = `/projects/${encodeURIComponent(projectId)}/pipelines?sha=${encodeURIComponent(sha)}`;
  return restPaginate<Pipeline>(path, options);
}
