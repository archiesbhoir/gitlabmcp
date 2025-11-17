/**
 * TypeScript interfaces for GitLab entities
 */

export interface Project {
  id: string;
  fullPath: string;
  name: string;
  webUrl: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string;
  webUrl: string;
}

export interface Commit {
  id: string;
  sha: string;
  title: string;
  message: string;
  authorName: string;
  authorEmail: string;
  authoredDate: string;
  committedDate: string;
  webUrl: string;
}

export interface Pipeline {
  id: string;
  status: string;
  ref: string;
  sha: string;
  webUrl: string;
  createdAt: string;
  updatedAt: string;
  duration?: number;
}

export interface ApprovalInfo {
  approved: boolean;
  approvedBy: User[];
  approvalsRequired: number;
  approvalsLeft: number;
}

export interface Diff {
  oldPath: string;
  newPath: string;
  aMode?: string;
  bMode?: string;
  diff: string;
  newFile: boolean;
  renamedFile: boolean;
  deletedFile: boolean;
}

export interface Note {
  id: string;
  body: string;
  author: User;
  createdAt: string;
  updatedAt: string;
  resolvable: boolean;
  resolved?: boolean;
  position?: {
    oldLine?: number;
    newLine?: number;
    oldPath?: string;
    newPath?: string;
  };
}

export interface Discussion {
  id: string;
  notes: Note[];
  resolved: boolean;
  resolvable: boolean;
}

export interface MergeRequest {
  id: string;
  iid: string;
  title: string;
  description?: string;
  state: string;
  author: User;
  assignees: User[];
  reviewers: User[];
  labels: string[];
  sourceBranch: string;
  targetBranch: string;
  webUrl: string;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
  changesCount?: string;
  commits?: Commit[];
  pipelines?: Pipeline[];
  approvals?: ApprovalInfo;
  diffs?: Diff[];
  discussions?: Discussion[];
}

/**
 * Normalized final output shape for UI consumption
 */
export interface MergeRequestView {
  id: string;
  iid: string;
  title: string;
  description?: string;
  state: string;
  author: User;
  assignees: User[];
  reviewers: User[];
  labels: string[];
  sourceBranch: string;
  targetBranch: string;
  webUrl: string;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
  changesCount?: string;
  commits: Commit[];
  pipelines: Pipeline[];
  approvals: ApprovalInfo;
  diffs: Diff[];
  discussions: Discussion[];
}
