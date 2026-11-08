import { apiClient } from './client';
import { ApiResponse } from './types';
import { TimeCapsuleItem, CapsulePaginationMeta, CreateCapsulePayload } from '@/types/capsule';

export interface GetCapsulesParams {
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
  status?: 'locked' | 'unlocked';
}

export const capsulesApi = {
  /**
   * Retrieve list of time capsules with pagination and status filtering.
   */
  async getCapsules(
    params: GetCapsulesParams = {}
  ): Promise<{ data: TimeCapsuleItem[]; pagination: CapsulePaginationMeta }> {
    const res = await apiClient.get<
      ApiResponse<TimeCapsuleItem[]> & { pagination: CapsulePaginationMeta }
    >('/api/capsules', {
      params: {
        page: params.page,
        limit: params.limit,
        sortOrder: params.sortOrder || undefined,
        status: params.status || undefined,
      },
    });

    return {
      data: res.data || [],
      pagination: res.pagination,
    };
  },

  /**
   * Retrieve a single time capsule by ID.
   * Throws ApiClientError with status 403 if capsule is locked by server time.
   */
  async getCapsule(id: string): Promise<TimeCapsuleItem> {
    const res = await apiClient.get<ApiResponse<TimeCapsuleItem>>(`/api/capsules/${id}`);
    if (!res.data) {
      throw new Error('Time capsule not found');
    }
    return res.data;
  },

  /**
   * Create and seal a new time capsule with a future unlock date.
   */
  async createCapsule(data: CreateCapsulePayload): Promise<TimeCapsuleItem> {
    const res = await apiClient.post<ApiResponse<TimeCapsuleItem>>('/api/capsules', data);
    if (!res.data) {
      throw new Error('Failed to create time capsule');
    }
    return res.data;
  },

  /**
   * Unseal an unlocked time capsule once server time has reached or surpassed unlockDate.
   * Throws ApiClientError with status 403 if server date check fails.
   */
  async openCapsule(id: string): Promise<TimeCapsuleItem> {
    const res = await apiClient.post<ApiResponse<TimeCapsuleItem>>(`/api/capsules/${id}/open`);
    if (!res.data) {
      throw new Error('Failed to unseal time capsule');
    }
    return res.data;
  },

  /**
   * Permanently delete a time capsule and clean up exclusive media assets.
   */
  async deleteCapsule(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/api/capsules/${id}`);
  },
};
