import { apiClient } from './client';
import { ApiResponse } from './types';
import {
  AiStatusData,
  CapsuleThenVsNowInsightData,
  MemoryBoardData,
  TimelineChapterSummaryData,
} from '@/types/ai';

export interface TimelineSummaryPayload {
  periodLabel: string;
  items: Array<{
    id: string;
    type: 'memory' | 'capsule';
  }>;
}

export const aiApi = {
  /**
   * Checks whether the configured local or cloud LLM endpoint is reachable.
   */
  async getStatus(): Promise<AiStatusData> {
    const res = await apiClient.get<ApiResponse<AiStatusData>>('/api/ai/status');
    if (!res.data) {
      throw new Error('Failed to check AI connection status.');
    }
    return res.data;
  },

  /**
   * Generates an AI summary for a Timeline Month/Year chapter.
   */
  async summarizeTimelineChapter(
    payload: TimelineSummaryPayload
  ): Promise<TimelineChapterSummaryData> {
    const res = await apiClient.post<ApiResponse<TimelineChapterSummaryData>>(
      '/api/ai/timeline-summary',
      payload
    );
    if (!res.data) {
      throw new Error('Failed to generate timeline chapter summary.');
    }
    return res.data;
  },

  /**
   * Generates a "Then vs. Now" insight comparing an unlocked capsule with recent memories.
   */
  async getCapsuleInsight(capsuleId: string): Promise<CapsuleThenVsNowInsightData> {
    const res = await apiClient.post<ApiResponse<CapsuleThenVsNowInsightData>>(
      `/api/ai/capsules/${capsuleId}/insight`
    );
    if (!res.data) {
      throw new Error('Failed to generate capsule insight.');
    }
    return res.data;
  },

  /**
   * Fetches all saved AI bulletin pinboards for the user (newest first).
   */
  async getBoards(): Promise<MemoryBoardData[]> {
    const res = await apiClient.get<ApiResponse<{ boards: MemoryBoardData[] }>>('/api/ai/board');
    return res.data?.boards ?? [];
  },

  /**
   * Generates an unsaved AI bulletin pinboard draft preview (does not overwrite saved boards).
   */
  async generateBoardDraft(focusPrompt?: string): Promise<MemoryBoardData> {
    const res = await apiClient.post<ApiResponse<MemoryBoardData>>('/api/ai/board', {
      focusPrompt: focusPrompt?.trim() || undefined,
    });
    if (!res.data) {
      throw new Error('Failed to arrange AI pinboard preview.');
    }
    return res.data;
  },

  /**
   * Explicitly saves a generated board preview as a new saved board (or updates `boardId`).
   */
  async saveBoard(
    board: MemoryBoardData,
    options?: { boardTitle?: string; boardId?: string }
  ): Promise<MemoryBoardData> {
    const res = await apiClient.put<ApiResponse<MemoryBoardData>>('/api/ai/board', {
      boardId: options?.boardId,
      boardTitle: (options?.boardTitle ?? board.boardTitle).trim() || board.boardTitle,
      curatorNote: board.curatorNote,
      focusPrompt: board.focusPrompt,
      generationMode: board.generationMode,
      modelName: board.modelName,
      clusters: board.clusters,
      pins: board.pins.map((p) => ({
        itemId: p.itemId,
        itemType: p.itemType,
        clusterId: p.clusterId,
        stickyNote: p.stickyNote,
        rotation: p.rotation,
        pinStyle: p.pinStyle,
      })),
      connections: board.connections,
    });
    if (!res.data) {
      throw new Error('Failed to save AI pinboard.');
    }
    return res.data;
  },

  /**
   * Deletes a saved AI bulletin pinboard by ID.
   */
  async deleteBoard(boardId: string): Promise<void> {
    await apiClient.delete(`/api/ai/board/${boardId}`);
  },
};

