/**
 * Core Memory and Photo TypeScript Definitions
 */

export interface MemoryPhoto {
  _id: string;
  id?: string;
  publicId: string;
  url?: string;
  secureUrl?: string;
  signedUrl?: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  caption?: string;
  takenAt?: string | Date;
  memoryId?: string;
  userId?: string;
  createdAt?: string | Date;
}

export interface MemoryItem {
  _id: string;
  userId: string;
  title: string;
  content: string;
  memoryDate: string;
  tags: string[];
  photos: MemoryPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface MemoriesListResponse {
  memories: MemoryItem[];
  pagination: PaginationMeta;
}
