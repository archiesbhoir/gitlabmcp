/**
 * Polling mechanism for real-time MR updates
 */
import { getMergeRequestView, GetMergeRequestViewOptions } from './mergeRequestView.js';
import { MergeRequestView } from '../types/index.js';

export interface PollingOptions extends GetMergeRequestViewOptions {
  intervalMs?: number;
  onUpdate?: (view: MergeRequestView) => void;
  onError?: (error: Error) => void;
}

export interface PollingController {
  stop: () => void;
  isRunning: () => boolean;
}

/**
 * Poll MR for updates
 */
export function pollMergeRequest(
  fullPath: string,
  iid: string,
  options: PollingOptions = {}
): PollingController {
  const {
    intervalMs = 25000, // Default 25 seconds
    onUpdate,
    onError,
    ...mrOptions
  } = options;

  let lastUpdatedAt: string | null = null;
  let intervalId: NodeJS.Timeout | null = null;
  let isRunning = false;

  const poll = async () => {
    if (!isRunning) {
      return;
    }

    try {
      const view = await getMergeRequestView(fullPath, iid, {
        ...mrOptions,
        forceRefresh: true, // Always fetch fresh data when polling
      });

      // Check if MR was updated
      if (lastUpdatedAt && lastUpdatedAt !== view.updatedAt) {
        if (onUpdate) {
          onUpdate(view);
        }
      }

      lastUpdatedAt = view.updatedAt;
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error : new Error('Unknown polling error'));
      }
    }
  };

  // Initial fetch
  poll();

  // Set up interval
  intervalId = setInterval(poll, intervalMs);
  isRunning = true;

  return {
    stop: () => {
      isRunning = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
    isRunning: () => isRunning,
  };
}
