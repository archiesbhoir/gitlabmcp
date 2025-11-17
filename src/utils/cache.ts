/**
 * LRU cache implementation for MR data
 */
import { LRUCache } from 'lru-cache';
import { MergeRequestView } from '../types/index.js';
import { getLogger } from './logger.js';

export interface CacheOptions {
  maxSize?: number;
  ttlMs?: number;
  diffTtlMs?: number;
}

const DEFAULT_OPTIONS: Required<CacheOptions> = {
  maxSize: 100,
  ttlMs: 30000, // 30 seconds for main MR
  diffTtlMs: 120000, // 2 minutes for diffs
};

export class MRCache {
  private cache: LRUCache<string, MergeRequestView>;
  private diffCache: LRUCache<string, MergeRequestView['diffs']>;
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    this.cache = new LRUCache<string, MergeRequestView>({
      max: this.options.maxSize,
      ttl: this.options.ttlMs,
    });

    this.diffCache = new LRUCache<string, MergeRequestView['diffs']>({
      max: this.options.maxSize,
      ttl: this.options.diffTtlMs,
    });
  }

  /**
   * Generate cache key for MR
   */
  private getKey(fullPath: string, iid: string): string {
    return `project:${fullPath}:mr:${iid}`;
  }

  /**
   * Get MR from cache
   */
  get(fullPath: string, iid: string): MergeRequestView | undefined {
    const logger = getLogger();
    const key = this.getKey(fullPath, iid);
    const cached = this.cache.get(key);
    if (cached) {
      logger.debug('Cache hit', { fullPath, iid });
    } else {
      logger.debug('Cache miss', { fullPath, iid });
    }
    return cached;
  }

  /**
   * Set MR in cache
   */
  set(fullPath: string, iid: string, value: MergeRequestView): void {
    const key = this.getKey(fullPath, iid);
    this.cache.set(key, value);
  }

  /**
   * Get diffs from cache
   */
  getDiffs(fullPath: string, iid: string): MergeRequestView['diffs'] | undefined {
    const key = this.getKey(fullPath, iid);
    return this.diffCache.get(key);
  }

  /**
   * Set diffs in cache
   */
  setDiffs(fullPath: string, iid: string, diffs: MergeRequestView['diffs']): void {
    const key = this.getKey(fullPath, iid);
    this.diffCache.set(key, diffs);
  }

  /**
   * Delete MR from cache
   */
  delete(fullPath: string, iid: string): void {
    const key = this.getKey(fullPath, iid);
    this.cache.delete(key);
    this.diffCache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.diffCache.clear();
  }

  /**
   * Get cache stats
   */
  getStats(): {
    size: number;
    diffSize: number;
  } {
    return {
      size: this.cache.size,
      diffSize: this.diffCache.size,
    };
  }
}

// Singleton instance
let defaultCache: MRCache | null = null;

/**
 * Get or create default cache instance
 */
export function getDefaultCache(options?: CacheOptions): MRCache {
  if (!defaultCache) {
    defaultCache = new MRCache(options);
  }
  return defaultCache;
}
