import { MemoryPhoto } from './memory';

export interface TimeCapsuleItem {
  _id: string;
  id?: string;
  userId: string;
  title: string;
  message?: string;
  unlockDate: string;
  unlockAt?: string;
  sealedAt: string;
  isOpened: boolean;
  openedAt?: string | null;
  isLocked: boolean;
  photos?: (MemoryPhoto | string)[];
  photoUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CapsulePaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CapsulesListResponse {
  capsules: TimeCapsuleItem[];
  pagination: CapsulePaginationMeta;
}

export interface CreateCapsulePayload {
  title: string;
  message: string;
  unlockDate?: string | Date;
  unlockAt?: string | Date;
  photos?: string[];
  photoIds?: string[];
  photoUrls?: string[];
}
