import { restPaginate, restRequest, RestRequestOptions } from './rest.js';
import { Job, Pipeline } from '../types/index.js';

interface RestPipeline {
  id: number;
  status: string;
  ref: string;
  sha: string;
  web_url: string;
  created_at: string;
  updated_at: string;
  duration: number | null;
  coverage: string | null;
  source?: string | null;
  detailed_status?: {
    icon?: string;
    text?: string;
    label?: string;
    group?: string;
    tooltip?: string;
    has_details?: boolean;
    details_path?: string;
  };
}

interface RestJob {
  id: number;
  name: string;
  stage: string;
  status: string;
  allow_failure?: boolean;
  created_at?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  duration?: number | null;
  coverage?: string | null;
  web_url: string;
  artifacts_file?: {
    filename: string;
    size?: number | null;
  } | null;
  runner?: {
    id: number;
    description?: string | null;
  } | null;
}

const encodeProject = (project: string | number): string => encodeURIComponent(String(project));

const mapPipeline = (pipeline: RestPipeline): Pipeline => ({
  id: String(pipeline.id),
  status: pipeline.status,
  ref: pipeline.ref,
  sha: pipeline.sha,
  webUrl: pipeline.web_url,
  createdAt: pipeline.created_at,
  updatedAt: pipeline.updated_at,
  duration: pipeline.duration ?? undefined,
  coverage: pipeline.coverage ?? undefined,
  source: pipeline.source ?? undefined,
  detailedStatus: pipeline.detailed_status
    ? {
        group: pipeline.detailed_status.group,
        icon: pipeline.detailed_status.icon,
        label: pipeline.detailed_status.text || pipeline.detailed_status.label,
        tooltip: pipeline.detailed_status.tooltip,
        hasDetails: pipeline.detailed_status.has_details,
        detailsPath: pipeline.detailed_status.details_path,
      }
    : undefined,
});

const mapJob = (job: RestJob): Job => ({
  id: String(job.id),
  name: job.name,
  stage: job.stage,
  status: job.status,
  allowFailure: job.allow_failure ?? undefined,
  webUrl: job.web_url,
  createdAt: job.created_at || undefined,
  startedAt: job.started_at || undefined,
  finishedAt: job.finished_at || undefined,
  duration: job.duration ?? undefined,
  coverage: job.coverage ?? undefined,
  artifacts:
    job.artifacts_file && job.artifacts_file.filename
      ? {
          filename: job.artifacts_file.filename,
          size: job.artifacts_file.size ?? undefined,
        }
      : undefined,
  runner: job.runner
    ? {
        id: String(job.runner.id),
        description: job.runner.description || undefined,
      }
    : undefined,
});

export async function getMRPipelines(
  projectPath: string | number,
  iid: string | number,
  options: RestRequestOptions = {}
): Promise<Pipeline[]> {
  const path = `/projects/${encodeProject(projectPath)}/merge_requests/${iid}/pipelines`;
  const pipelines = await restPaginate<RestPipeline>(path, options);
  return pipelines.map(mapPipeline);
}

export async function getPipeline(
  projectPath: string | number,
  pipelineId: string | number,
  options: RestRequestOptions = {}
): Promise<Pipeline> {
  const path = `/projects/${encodeProject(projectPath)}/pipelines/${pipelineId}`;
  const pipeline = await restRequest<RestPipeline>(path, options);
  return mapPipeline(pipeline);
}

export interface PipelineJobsOptions extends RestRequestOptions {
  scope?:
    | 'created'
    | 'pending'
    | 'running'
    | 'failed'
    | 'success'
    | 'canceled'
    | 'skipped'
    | 'manual';
}

export async function getPipelineJobs(
  projectPath: string | number,
  pipelineId: string | number,
  options: PipelineJobsOptions = {}
): Promise<Job[]> {
  const { scope, ...restOptions } = options;
  const basePath = `/projects/${encodeProject(projectPath)}/pipelines/${pipelineId}/jobs`;
  const path = scope ? `${basePath}?scope=${encodeURIComponent(scope)}` : basePath;
  const jobs = await restPaginate<RestJob>(path, restOptions);
  return jobs.map(mapJob);
}


