/**
 * GraphQL queries for Merge Requests
 */

export const MR_FULL_QUERY = `
  query GetMergeRequest($fullPath: ID!, $iid: String!, $commitsFirst: Int, $discussionsFirst: Int, $commitsAfter: String, $discussionsAfter: String) {
    project(fullPath: $fullPath) {
      id
      fullPath
      name
      webUrl
      mergeRequest(iid: $iid) {
        id
        iid
        title
        description
        state
        sourceBranch
        targetBranch
        webUrl
        createdAt
        updatedAt
        mergedAt
        author {
          id
          username
          name
          avatarUrl
          webUrl
        }
        assignees {
          nodes {
            id
            username
            name
            avatarUrl
            webUrl
          }
        }
        reviewers {
          nodes {
            id
            username
            name
            avatarUrl
            webUrl
          }
        }
        labels {
          nodes {
            title
          }
        }
        commits(first: $commitsFirst, after: $commitsAfter) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            sha
            title
            message
            authorName
            authorEmail
            authoredDate
            committedDate
            webUrl
          }
        }
        pipelines {
          nodes {
            id
            status
            ref
            sha
            createdAt
            updatedAt
            duration
          }
        }
        approved
        discussions(first: $discussionsFirst, after: $discussionsAfter) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            resolved
            resolvable
            notes {
              nodes {
                id
                body
                author {
                  id
                  username
                  name
                  avatarUrl
                  webUrl
                }
                createdAt
                updatedAt
                resolvable
                resolved
                position {
                  oldLine
                  newLine
                  oldPath
                  newPath
                }
              }
            }
          }
        }
      }
    }
  }
`;

export interface MRQueryVariables {
  fullPath: string;
  iid: string;
  commitsFirst?: number;
  discussionsFirst?: number;
  commitsAfter?: string;
  discussionsAfter?: string;
}

export interface MRQueryResponse {
  project: {
    id: string;
    fullPath: string;
    name: string;
    webUrl: string;
    mergeRequest: {
      id: string;
      iid: string;
      title: string;
      description: string | null;
      state: string;
      sourceBranch: string;
      targetBranch: string;
      webUrl: string;
      createdAt: string;
      updatedAt: string;
      mergedAt: string | null;
      author: {
        id: string;
        username: string;
        name: string;
        avatarUrl: string | null;
        webUrl: string;
      };
      assignees: {
        nodes: Array<{
          id: string;
          username: string;
          name: string;
          avatarUrl: string | null;
          webUrl: string;
        }>;
      };
      reviewers: {
        nodes: Array<{
          id: string;
          username: string;
          name: string;
          avatarUrl: string | null;
          webUrl: string;
        }>;
      };
      labels: {
        nodes: Array<{
          title: string;
        }>;
      };
      commits: {
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
        nodes: Array<{
          id: string;
          sha: string;
          title: string;
          message: string;
          authorName: string;
          authorEmail: string;
          authoredDate: string;
          committedDate: string;
          webUrl: string;
        }>;
      };
      pipelines: {
        nodes: Array<{
          id: string;
          status: string;
          ref: string;
          sha: string;
          createdAt: string;
          updatedAt: string;
          duration: number | null;
        }>;
      };
      approved: boolean;
      discussions: {
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
        nodes: Array<{
          id: string;
          resolved: boolean;
          resolvable: boolean;
          notes: {
            nodes: Array<{
              id: string;
              body: string;
              author: {
                id: string;
                username: string;
                name: string;
                avatarUrl: string | null;
                webUrl: string;
              };
              createdAt: string;
              updatedAt: string;
              resolvable: boolean;
              resolved: boolean | null;
              position: {
                oldLine: number | null;
                newLine: number | null;
                oldPath: string | null;
                newPath: string | null;
              } | null;
            }>;
          };
        }>;
      };
    } | null;
  } | null;
}
