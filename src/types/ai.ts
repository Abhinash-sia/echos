export type AiGenerationMode = 'ai' | 'heuristic';

export interface AiStatusData {
  configured: boolean;
  connected: boolean;
  providerType: 'local' | 'cloud' | 'unconfigured';
  model: string;
  endpointHost: string | null;
  modelAvailable: boolean;
  availableModels: string[];
  latencyMs: number | null;
  message: string;
}

export interface TimelineChapterSummaryData {
  periodLabel: string;
  entryCount: number;
  mode: AiGenerationMode;
  model: string;
  warning?: string;
  headline: string;
  summary: string;
  mood: string;
  themes: string[];
  highlightTitle: string;
}

export interface CapsuleThenVsNowInsightData {
  capsuleId: string;
  comparedMemoriesCount: number;
  mode: AiGenerationMode;
  model: string;
  warning?: string;
  eraLabel: string;
  thenSummary: string;
  nowSummary: string;
  shifts: string[];
  reflectionPrompt: string;
}

export type BoardClusterColor = 'coral' | 'teal' | 'cobalt' | 'yellow' | 'pink';
export type BoardPinStyle = 'polaroid' | 'index-card' | 'wax-seal' | 'sticky';

export interface BoardCluster {
  id: string;
  label: string;
  color: BoardClusterColor;
  summary: string;
}

export interface BoardPhotoPreview {
  _id: string;
  url: string;
  signedUrl: string;
}

export interface HydratedBoardPin {
  itemId: string;
  itemType: 'memory' | 'capsule';
  clusterId: string;
  stickyNote: string;
  rotation: number;
  pinStyle: BoardPinStyle;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  isLocked: boolean;
  isOpened?: boolean;
  photos: BoardPhotoPreview[];
}

export interface BoardConnection {
  fromItemId: string;
  toItemId: string;
  reason: string;
}

export interface MemoryBoardData {
  _id: string;
  isDraft?: boolean;
  boardTitle: string;
  curatorNote: string;
  focusPrompt?: string;
  generationMode: AiGenerationMode;
  modelName: string;
  generatedAt: string;
  warning?: string;
  clusters: BoardCluster[];
  pins: HydratedBoardPin[];
  connections: BoardConnection[];
}

