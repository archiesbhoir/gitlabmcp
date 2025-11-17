/**
 * Merge Request API client
 */
import { graphqlRequest, GraphQLRequestOptions } from './graphql.js';
import { MR_FULL_QUERY, MRQueryVariables, MRQueryResponse } from '../queries/mergeRequest.js';
import { GitLabErrorCode, createGitLabError } from '../utils/errors.js';

export interface GetMergeRequestOptions extends GraphQLRequestOptions {
  commitsFirst?: number;
  discussionsFirst?: number;
  commitsAfter?: string;
  discussionsAfter?: string;
}

/**
 * Fetch a merge request using GraphQL
 */
export async function getMergeRequest(
  fullPath: string,
  iid: string,
  options: GetMergeRequestOptions = {}
): Promise<MRQueryResponse> {
  const {
    commitsFirst = 50,
    discussionsFirst = 50,
    commitsAfter,
    discussionsAfter,
    ...graphqlOptions
  } = options;

  const variables: MRQueryVariables = {
    fullPath,
    iid,
    commitsFirst,
    discussionsFirst,
    commitsAfter,
    discussionsAfter,
  };

  try {
    const data = await graphqlRequest<MRQueryResponse>(
      MR_FULL_QUERY,
      variables as unknown as Record<string, unknown>,
      graphqlOptions
    );

    if (!data.project) {
      throw createGitLabError(GitLabErrorCode.GITLAB_NOT_FOUND, `Project not found: ${fullPath}`);
    }

    if (!data.project.mergeRequest) {
      throw createGitLabError(
        GitLabErrorCode.GITLAB_NOT_FOUND,
        `Merge request !${iid} not found in project ${fullPath}`
      );
    }

    return data;
  } catch (error) {
    // Re-throw GitLab errors as-is
    if (error instanceof Error && 'code' in error) {
      throw error;
    }

    // Wrap unknown errors
    throw createGitLabError(
      GitLabErrorCode.GITLAB_UNKNOWN_ERR,
      `Failed to fetch merge request: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
