/**
 * High-level API for fetching normalized MergeRequestView with caching
 */
import { getMergeRequest, GetMergeRequestOptions } from './mergeRequest.js';
import { normalizeMR } from './normalize.js';
import { getDefaultCache, MRCache } from '../utils/cache.js';
import { MergeRequestView } from '../types/index.js';
import { GitLabErrorCode, createGitLabError } from '../utils/errors.js';

export interface GetMergeRequestViewOptions extends GetMergeRequestOptions {
  forceRefresh?: boolean;
  useCache?: boolean;
  cache?: MRCache;
}

/**
 * Get normalized MergeRequestView with caching support
 */
export async function getMergeRequestView(
  fullPath: string,
  iid: string,
  options: GetMergeRequestViewOptions = {}
): Promise<MergeRequestView> {
  const {
    forceRefresh = false,
    useCache = true,
    cache = getDefaultCache(),
    ...graphqlOptions
  } = options;

  // Check cache first
  if (useCache && !forceRefresh) {
    const cached = cache.get(fullPath, iid);
    if (cached) {
      return cached;
    }
  }

  try {
    // Fetch from GraphQL
    const data = await getMergeRequest(fullPath, iid, graphqlOptions);

    // Normalize the response
    const view = normalizeMR(data);

    // Cache the result
    if (useCache) {
      cache.set(fullPath, iid, view);
    }

    return view;
  } catch (error) {
    // Re-throw GitLab errors as-is
    if (error instanceof Error && 'code' in error) {
      throw error;
    }

    // Wrap unknown errors
    throw createGitLabError(
      GitLabErrorCode.GITLAB_UNKNOWN_ERR,
      `Failed to fetch merge request view: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
