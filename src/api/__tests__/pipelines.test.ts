import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMRPipelines, getPipeline, getPipelineJobs } from '../pipelines.js';
import { restPaginate, restRequest } from '../rest.js';

vi.mock('../rest.js', () => ({
  restPaginate: vi.fn(),
  restRequest: vi.fn(),
}));

const mockedRestPaginate = restPaginate as unknown as ReturnType<typeof vi.fn>;
const mockedRestRequest = restRequest as unknown as ReturnType<typeof vi.fn>;

describe('pipelines API helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMRPipelines returns normalized pipelines', async () => {
    mockedRestPaginate.mockResolvedValueOnce([
      {
        id: 42,
        status: 'success',
        ref: 'main',
        sha: 'abc123',
        web_url: 'https://gitlab.example.com/pipelines/42',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:02:00Z',
        duration: 120,
        coverage: '98.5',
        source: 'push',
        detailed_status: {
          icon: 'status_success',
          text: 'passed',
          group: 'success',
          tooltip: 'Pipeline passed',
          has_details: true,
          details_path: '/details',
        },
      },
    ]);

    const result = await getMRPipelines('group/project', '7');

    expect(mockedRestPaginate).toHaveBeenCalledWith(
      '/projects/group%2Fproject/merge_requests/7/pipelines',
      {}
    );
    expect(result).toEqual([
      expect.objectContaining({
        id: '42',
        status: 'success',
        coverage: '98.5',
        detailedStatus: expect.objectContaining({
          label: 'passed',
          group: 'success',
        }),
      }),
    ]);
  });

  it('getPipeline fetches a single pipeline', async () => {
    mockedRestRequest.mockResolvedValueOnce({
      id: 99,
      status: 'failed',
      ref: 'feature-x',
      sha: 'def456',
      web_url: 'https://gitlab.example.com/pipelines/99',
      created_at: '2024-02-01T00:00:00Z',
      updated_at: '2024-02-01T00:01:00Z',
      duration: null,
      coverage: null,
    });

    const pipeline = await getPipeline('group/project', '99');

    expect(mockedRestRequest).toHaveBeenCalledWith(
      '/projects/group%2Fproject/pipelines/99',
      {}
    );
    expect(pipeline).toMatchObject({
      id: '99',
      status: 'failed',
      duration: undefined,
    });
  });

  it('getPipelineJobs filters by scope and normalizes jobs', async () => {
    mockedRestPaginate.mockResolvedValueOnce([
      {
        id: 5,
        name: 'test',
        stage: 'test',
        status: 'failed',
        allow_failure: false,
        created_at: '2024-03-01T00:00:00Z',
        started_at: '2024-03-01T00:01:00Z',
        finished_at: '2024-03-01T00:02:00Z',
        duration: 60,
        coverage: null,
        web_url: 'https://gitlab.example.com/jobs/5',
        artifacts_file: {
          filename: 'artifact.zip',
          size: 1024,
        },
        runner: {
          id: 7,
          description: 'shared-runner',
        },
      },
    ]);

    const jobs = await getPipelineJobs('group/project', '42', { scope: 'failed' });

    expect(mockedRestPaginate).toHaveBeenCalledWith(
      '/projects/group%2Fproject/pipelines/42/jobs?scope=failed',
      {}
    );
    expect(jobs).toEqual([
      expect.objectContaining({
        id: '5',
        name: 'test',
        stage: 'test',
        artifacts: expect.objectContaining({
          filename: 'artifact.zip',
          size: 1024,
        }),
        runner: expect.objectContaining({
          id: '7',
          description: 'shared-runner',
        }),
      }),
    ]);
  });
});


