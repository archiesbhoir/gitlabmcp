import { getMergeRequest, GetMergeRequestOptions } from './mergeRequest.js';
import { Commit, Discussion } from '../types/index.js';

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  pageInfo: PageInfo;
}

export async function fetchMoreCommits(
  fullPath: string,
  iid: string,
  cursor: string,
  options: Omit<GetMergeRequestOptions, 'commitsAfter'> = {}
): Promise<PaginatedResult<Commit>> {
  const data = await getMergeRequest(fullPath, iid, {
    ...options,
    commitsAfter: cursor,
    commitsFirst: options.commitsFirst || 50,
  });

  if (!data.project?.mergeRequest) {
    return {
      items: [],
      pageInfo: { hasNextPage: false, endCursor: null },
    };
  }

  const commits = data.project.mergeRequest.commits;
  const pageInfo = commits.pageInfo;

  return {
    items: commits.nodes.map((node) => ({
      id: node.id,
      sha: node.sha,
      title: node.title,
      message: node.message,
      authorName: node.authorName,
      authorEmail: node.authorEmail,
      authoredDate: node.authoredDate,
      committedDate: node.committedDate,
      webUrl: node.webUrl,
    })),
    pageInfo: {
      hasNextPage: pageInfo.hasNextPage,
      endCursor: pageInfo.endCursor,
    },
  };
}

export async function fetchMoreDiscussions(
  fullPath: string,
  iid: string,
  cursor: string,
  options: Omit<GetMergeRequestOptions, 'discussionsAfter'> = {}
): Promise<PaginatedResult<Discussion>> {
  const data = await getMergeRequest(fullPath, iid, {
    ...options,
    discussionsAfter: cursor,
    discussionsFirst: options.discussionsFirst || 50,
  });

  if (!data.project?.mergeRequest) {
    return {
      items: [],
      pageInfo: { hasNextPage: false, endCursor: null },
    };
  }

  const discussions = data.project.mergeRequest.discussions;
  const pageInfo = discussions.pageInfo;

  return {
    items: discussions.nodes.map((node) => ({
      id: node.id,
      resolved: node.resolved,
      resolvable: node.resolvable,
      notes: node.notes.nodes.map((note) => ({
        id: note.id,
        body: note.body,
        author: {
          id: note.author.id,
          username: note.author.username,
          name: note.author.name,
          avatarUrl: note.author.avatarUrl || undefined,
          webUrl: note.author.webUrl,
        },
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
      })),
    })),
    pageInfo: {
      hasNextPage: pageInfo.hasNextPage,
      endCursor: pageInfo.endCursor,
    },
  };
}

export function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

export async function fetchAllCommits(
  fullPath: string,
  iid: string,
  options: Omit<GetMergeRequestOptions, 'commitsAfter'> = {}
): Promise<Commit[]> {
  const allCommits: Commit[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  const firstPage = await fetchMoreCommits(fullPath, iid, '', options);
  allCommits.push(...firstPage.items);
  cursor = firstPage.pageInfo.endCursor;
  hasMore = firstPage.pageInfo.hasNextPage;

  while (hasMore && cursor) {
    const page = await fetchMoreCommits(fullPath, iid, cursor, options);
    allCommits.push(...page.items);
    cursor = page.pageInfo.endCursor;
    hasMore = page.pageInfo.hasNextPage;
  }

  return deduplicateById(allCommits);
}

export async function fetchAllDiscussions(
  fullPath: string,
  iid: string,
  options: Omit<GetMergeRequestOptions, 'discussionsAfter'> = {}
): Promise<Discussion[]> {
  const allDiscussions: Discussion[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  const firstPage = await fetchMoreDiscussions(fullPath, iid, '', options);
  allDiscussions.push(...firstPage.items);
  cursor = firstPage.pageInfo.endCursor;
  hasMore = firstPage.pageInfo.hasNextPage;

  while (hasMore && cursor) {
    const page = await fetchMoreDiscussions(fullPath, iid, cursor, options);
    allDiscussions.push(...page.items);
    cursor = page.pageInfo.endCursor;
    hasMore = page.pageInfo.hasNextPage;
  }

  return deduplicateById(allDiscussions);
}
