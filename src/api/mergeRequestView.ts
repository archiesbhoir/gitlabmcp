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

  if (useCache && !forceRefresh) {
    const cached = cache.get(fullPath, iid);
    if (cached) {
      return cached;
    }
  }

  try {
    const data = await getMergeRequest(fullPath, iid, graphqlOptions);

    const view = normalizeMR(data);

    if (useCache) {
      cache.set(fullPath, iid, view);
    }

    return view;
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }

    throw createGitLabError(
      GitLabErrorCode.GITLAB_UNKNOWN_ERR,
      `Failed to fetch merge request view: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
