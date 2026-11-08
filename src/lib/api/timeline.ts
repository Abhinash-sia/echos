import { apiClient } from './client';
import { ApiResponse } from './types';
import { TimelineItem, TimelinePaginationMeta, GetTimelineParams } from '@/types/timeline';

export const timelineApi = {
  /**
   * Retrieve the unified chronological feed of memories and time capsules.
   * Supports cursor-based and offset-based pagination, type filtering, and date range filters.
   */
  async getTimeline(
    params: GetTimelineParams = {}
  ): Promise<{ data: TimelineItem[]; pagination: TimelinePaginationMeta }> {
    const res = await apiClient.get<
      ApiResponse<TimelineItem[]> & { pagination: TimelinePaginationMeta }
    >('/api/timeline', {
      params: {
        type: params.type || undefined,
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
        page: params.page,
        limit: params.limit,
        sortOrder: params.sortOrder || undefined,
        cursor: params.cursor || undefined,
      },
    });

    return {
      data: res.data || [],
      pagination: res.pagination,
    };
  },
};
