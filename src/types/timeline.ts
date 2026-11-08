import { MemoryPhoto } from './memory';

export type TimelineItemType = 'all' | 'memory' | 'capsule';

export interface BaseTimelineItem {
  id: string;
  _id: string;
  type: 'memory' | 'capsule';
  title: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineMemoryItem extends BaseTimelineItem {
  type: 'memory';
  tags: string[];
  content?: string;
  photos: MemoryPhoto[];
}

export interface TimelineCapsuleItem extends BaseTimelineItem {
  type: 'capsule';
  unlockDate: string;
  sealedAt?: string;
  isLocked: boolean;
  isOpened: boolean;
  openedAt?: string | null;
  content?: string;
  message?: string;
  photos?: MemoryPhoto[];
  photoUrls?: string[];
}

export type TimelineItem = TimelineMemoryItem | TimelineCapsuleItem;

export interface TimelinePaginationMeta {
  total: number;
  limit: number;
  page?: number;
  totalPages?: number;
  hasNextPage: boolean;
  hasPrevPage?: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
}

export interface TimelineResponse {
  data: TimelineItem[];
  pagination: TimelinePaginationMeta;
}

export interface GetTimelineParams {
  type?: TimelineItemType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
  cursor?: string;
}
