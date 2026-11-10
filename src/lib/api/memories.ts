import { apiClient } from './client';
import { ApiResponse } from './types';
import { MemoryItem, MemoryPhoto, PaginationMeta } from '@/types/memory';
import { CreateMemoryInput, UpdateMemoryInput } from '@/validations/memory';

export interface GetMemoriesParams {
  search?: string;
  tag?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export const memoriesApi = {
  /**
   * Retrieve list of memories with search, tag filters, sorting, and pagination.
   */
  async getMemories(
    params: GetMemoriesParams = {}
  ): Promise<{ data: MemoryItem[]; pagination: PaginationMeta }> {
    const res = await apiClient.get<ApiResponse<MemoryItem[]> & { pagination: PaginationMeta }>(
      '/api/memories',
      {
        params: {
          search: params.search || undefined,
          tag: params.tag || undefined,
          sortOrder: params.sortOrder || undefined,
          page: params.page,
          limit: params.limit,
          startDate: params.startDate || undefined,
          endDate: params.endDate || undefined,
        },
      }
    );

    return {
      data: res.data || [],
      pagination: res.pagination,
    };
  },

  /**
   * Retrieve a single memory by ID, populated with signed photo URLs.
   */
  async getMemory(id: string): Promise<MemoryItem> {
    const res = await apiClient.get<ApiResponse<MemoryItem>>(`/api/memories/${id}`);
    if (!res.data) {
      throw new Error('Memory record not found');
    }
    return res.data;
  },

  /**
   * Create a new memory entry.
   */
  async createMemory(data: CreateMemoryInput): Promise<MemoryItem> {
    const res = await apiClient.post<ApiResponse<MemoryItem>>('/api/memories', data);
    if (!res.data) {
      throw new Error('Failed to create memory record');
    }
    return res.data;
  },

  /**
   * Partially update an existing memory.
   */
  async updateMemory(id: string, data: UpdateMemoryInput): Promise<MemoryItem> {
    const res = await apiClient.patch<ApiResponse<MemoryItem>>(`/api/memories/${id}`, data);
    if (!res.data) {
      throw new Error('Failed to update memory record');
    }
    return res.data;
  },

  /**
   * Delete an existing memory and cascade cleanup attached media.
   */
  async deleteMemory(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/api/memories/${id}`);
  },

  /**
   * Upload a photograph and attach it to a memory.
   */
  async uploadPhoto(memoryId: string, file: File, caption?: string): Promise<MemoryPhoto> {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) {
      formData.append('caption', caption);
    }

    const res = await apiClient.upload<ApiResponse<MemoryPhoto | { photo: MemoryPhoto }>>(
      `/api/memories/${memoryId}/photos`,
      formData
    );

    const photo =
      res.data && 'photo' in res.data && res.data.photo
        ? res.data.photo
        : (res.data as MemoryPhoto | undefined);

    if (!photo || !photo._id) {
      throw new Error('Failed to upload photograph');
    }
    return photo;
  },

  /**
   * Delete a photograph from Cloudinary and unlink from memory.
   */
  async deletePhoto(memoryId: string, photoId: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/api/memories/${memoryId}/photos/${photoId}`);
  },
};
