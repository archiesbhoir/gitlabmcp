import { MRQueryResponse } from '../queries/mergeRequest.js';
import {
  MergeRequestView,
  User,
  Commit,
  Pipeline,
  ApprovalInfo,
  Diff,
  Discussion,
  Note,
} from '../types/index.js';

export function normalizeMR(data: MRQueryResponse): MergeRequestView {
  if (!data.project?.mergeRequest) {
    throw new Error('Invalid MR data: project or mergeRequest is null');
  }

  const mr = data.project.mergeRequest;

  const normalizeUser = (user: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string | null;
    webUrl: string;
  }): User => ({
    id: user.id,
    username: user.username,
    name: user.name,
    avatarUrl: user.avatarUrl || undefined,
    webUrl: user.webUrl,
  });

  const commits: Commit[] = mr.commits.nodes.map((node) => ({
    id: node.id,
    sha: node.sha,
    title: node.title,
    message: node.message,
    authorName: node.authorName,
    authorEmail: node.authorEmail,
    authoredDate: node.authoredDate,
    committedDate: node.committedDate,
    webUrl: node.webUrl,
  }));

  const pipelines: Pipeline[] = mr.pipelines.nodes.map((node) => ({
    id: node.id,
    status: node.status,
    ref: node.ref,
    sha: node.sha,
    webUrl: '', // Not available in GraphQL, will need REST fallback or construct from base URL
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    duration: node.duration || undefined,
  }));

  const approvals: ApprovalInfo = {
    approved: mr.approved,
    approvedBy: [],
    approvalsRequired: 0,
    approvalsLeft: 0,
  };

  const diffs: Diff[] = [];

  const discussions: Discussion[] = mr.discussions.nodes.map((node) => ({
    id: node.id,
    resolved: node.resolved,
    resolvable: node.resolvable,
    notes: node.notes.nodes.map(
      (note): Note => ({
        id: note.id,
        body: note.body,
        author: normalizeUser(note.author),
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        resolvable: note.resolvable,
        resolved: note.resolved || undefined,
        position: note.position
          ? {
              oldLine: note.position.oldLine || undefined,
              newLine: note.position.newLine || undefined,
              oldPath: note.position.oldPath || undefined,
              newPath: note.position.newPath || undefined,
            }
          : undefined,
      })
    ),
  }));

  const view: MergeRequestView = {
    id: mr.id,
    iid: mr.iid,
    title: mr.title,
    description: mr.description || undefined,
    state: mr.state,
    author: normalizeUser(mr.author),
    assignees: mr.assignees.nodes.map(normalizeUser),
    reviewers: mr.reviewers.nodes.map(normalizeUser),
    labels: mr.labels.nodes.map((label) => label.title),
    sourceBranch: mr.sourceBranch,
    targetBranch: mr.targetBranch,
    webUrl: mr.webUrl,
    createdAt: mr.createdAt,
    updatedAt: mr.updatedAt,
    mergedAt: mr.mergedAt || undefined,
    changesCount: undefined,
    commits,
    pipelines,
    approvals,
    diffs,
    discussions,
  };

  return view;
}
