import {
  BoardClusterColor,
  BoardPinStyle,
} from '@/models/MemoryBoard';
import {
  BoardLayoutOutput,
  CapsuleInsightOutput,
  TimelineChapterSummaryOutput,
  boardLayoutOutputSchema,
  capsuleInsightOutputSchema,
  semanticFilterOutputSchema,
  timelineChapterSummaryOutputSchema,
} from '@/validations/ai';
import { AiCompletionResult, generateStructuredCompletion, isLiveAiConfigured } from './client';

export interface TimelineSummarySourceItem {
  id: string;
  type: 'memory' | 'capsule';
  title: string;
  date: string;
  text: string;
  tags: string[];
  photoCount: number;
  isLocked: boolean;
}

export interface CapsuleInsightMemoryContext {
  id: string;
  title: string;
  date: string;
  content: string;
  tags: string[];
}

export interface BoardSourceItem {
  itemId: string;
  itemType: 'memory' | 'capsule';
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  photoCount: number;
  isLocked: boolean;
}

const STOP_WORDS = new Set([
  'about',
  'after',
  'again',
  'also',
  'always',
  'around',
  'because',
  'been',
  'before',
  'being',
  'could',
  'every',
  'first',
  'from',
  'have',
  'here',
  'into',
  'just',
  'like',
  'made',
  'make',
  'more',
  'much',
  'never',
  'only',
  'other',
  'over',
  'really',
  'said',
  'some',
  'still',
  'such',
  'than',
  'that',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'those',
  'through',
  'today',
  'very',
  'want',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'with',
  'would',
  'your',
]);

function extractKeywords(texts: string[], existingTags: string[] = [], limit = 5): string[] {
  const counts = new Map<string, number>();

  for (const tag of existingTags) {
    const clean = tag.trim().toLowerCase();
    if (clean.length >= 2) {
      counts.set(clean, (counts.get(clean) || 0) + 3);
    }
  }

  for (const text of texts) {
    const words = text.toLowerCase().match(/[a-z]{4,18}/g) || [];
    for (const w of words) {
      if (!STOP_WORDS.has(w)) {
        counts.set(w, (counts.get(w) || 0) + 1);
      }
    }
  }

  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, limit);

  return sorted.length > 0 ? sorted : ['reflection', 'milestone'];
}

function inferMoodFromTexts(texts: string[]): string {
  const joined = texts.join(' ').toLowerCase();
  if (/(happy|joy|laugh|love|celebrate|wonderful|grateful|excited|sun|smile)/.test(joined)) {
    return 'Warm & Joyful';
  }
  if (/(learn|grow|career|project|goal|build|finish|proud|milestone)/.test(joined)) {
    return 'Driven & Purposeful';
  }
  if (/(miss|quiet|rain|nostalgia|change|hard|worry|alone|hope)/.test(joined)) {
    return 'Reflective & Bittersweet';
  }
  if (/(travel|trip|mountain|ocean|road|city|flight|explore)/.test(joined)) {
    return 'Adventurous & Vivid';
  }
  return 'Thoughtful & Grounded';
}

/**
 * 1. Timeline Chapter Summary
 */
export async function generateTimelineChapterSummary(params: {
  periodLabel: string;
  items: TimelineSummarySourceItem[];
}): Promise<AiCompletionResult<TimelineChapterSummaryOutput>> {
  const { periodLabel, items } = params;

  const promptItems = items.map((item) => ({
    title: item.title,
    type: item.type,
    date: item.date,
    tags: item.tags,
    photoCount: item.photoCount,
    isLocked: item.isLocked,
    text: item.isLocked ? '[SEALED TIME CAPSULE — CONTENTS LOCKED]' : item.text.slice(0, 600),
  }));

  const systemPrompt = `You are the archival curator for ECHOES, a personal memory journal and time capsule vault.
Summarize a chronological chapter of a user's life entries in warm, concise, grounded editorial prose.
Never invent events not present in the entries. Never guess the contents of locked capsules.
Return ONLY valid JSON matching this exact shape:
{
  "headline": "Short poetic chapter title (max 10 words)",
  "summary": "2-3 sentence cohesive summary of what happened and felt central in this period",
  "mood": "2-3 word emotional tone (e.g. 'Warm & Reflective')",
  "themes": ["up to 5 lowercase theme tags"],
  "highlightTitle": "Exact title of the most notable entry from the input"
}`;

  const userPrompt = `Period: ${periodLabel}
Entries (${promptItems.length}):
${JSON.stringify(promptItems, null, 2)}`;

  const fallback = (): TimelineChapterSummaryOutput => {
    const unlockedTexts = items
      .filter((i) => !i.isLocked)
      .map((i) => `${i.title}. ${i.text}`);
    const allTags = items.flatMap((i) => i.tags);
    const themes = extractKeywords(unlockedTexts, allTags, 5);
    const mood = inferMoodFromTexts(unlockedTexts);
    const memoryCount = items.filter((i) => i.type === 'memory').length;
    const capsuleCount = items.filter((i) => i.type === 'capsule').length;
    const photoTotal = items.reduce((sum, i) => sum + i.photoCount, 0);

    const highlight =
      items.find((i) => !i.isLocked && i.photoCount > 0) ||
      items.find((i) => !i.isLocked) ||
      items[0];

    const parts: string[] = [];
    if (memoryCount > 0) {
      parts.push(`${memoryCount} journal ${memoryCount === 1 ? 'memory' : 'memories'}`);
    }
    if (capsuleCount > 0) {
      parts.push(`${capsuleCount} time ${capsuleCount === 1 ? 'capsule' : 'capsules'}`);
    }
    const countsText = parts.join(' and ') || `${items.length} entries`;
    const photoNote =
      photoTotal > 0 ? ` accompanied by ${photoTotal} archived photograph${photoTotal > 1 ? 's' : ''}` : '';

    return {
      headline: `${periodLabel}: Chapters in ${themes[0] ? themes[0][0].toUpperCase() + themes[0].slice(1) : 'Motion'}`,
      summary: `Across ${countsText}${photoNote}, this chapter centered around ${themes.slice(0, 3).join(', ')}. "${highlight.title}" stands out as a defining anchor of ${periodLabel}.`,
      mood,
      themes,
      highlightTitle: highlight.title,
    };
  };

  const result = await generateStructuredCompletion({
    systemPrompt,
    userPrompt,
    schema: timelineChapterSummaryOutputSchema,
    fallback,
  });

  if (!result.data.highlightTitle && items[0]) {
    const highlight =
      items.find((i) => !i.isLocked && i.photoCount > 0) ||
      items.find((i) => !i.isLocked) ||
      items[0];
    result.data = {
      ...result.data,
      highlightTitle: highlight.title,
    };
  }

  return result;
}

/**
 * 2. Capsule "Then vs. Now" Insight
 */
export async function generateCapsuleThenVsNowInsight(params: {
  capsule: {
    title: string;
    message: string;
    sealedAt: string;
    unlockDate: string;
  };
  recentMemories: CapsuleInsightMemoryContext[];
}): Promise<AiCompletionResult<CapsuleInsightOutput>> {
  const { capsule, recentMemories } = params;

  const sealedMs = new Date(capsule.sealedAt).getTime();
  const nowMs = Date.now();
  const daysBetween = Math.max(1, Math.round((nowMs - sealedMs) / (1000 * 60 * 60 * 24)));
  const eraSpan =
    daysBetween >= 365
      ? `${(daysBetween / 365).toFixed(1).replace(/\.0$/, '')} Year${daysBetween >= 548 ? 's' : ''} Later`
      : daysBetween >= 30
        ? `${Math.round(daysBetween / 30)} Month${daysBetween >= 45 ? 's' : ''} Later`
        : `${daysBetween} Day${daysBetween > 1 ? 's' : ''} Since Sealing`;

  const systemPrompt = `You are a thoughtful personal reflection guide inside ECHOES.
Compare an unsealed Time Capsule letter written by the user's past self against their recent journal memories ("Now").
Be empathetic, specific to the provided texts, and honest if recent memories are sparse. Never fabricate memories.
Return ONLY valid JSON matching this exact shape:
{
  "eraLabel": "Short span label (e.g. '${eraSpan}')",
  "thenSummary": "2-3 sentences capturing what the user was thinking, hoping, or feeling when sealing the capsule",
  "nowSummary": "2-3 sentences reflecting what their recent memories show about life today",
  "shifts": ["2 to 4 concise bullet points comparing past expectations vs present reality or continuity"],
  "reflectionPrompt": "One thoughtful journaling prompt the user could write about next"
}`;

  const userPrompt = `UNSEALED CAPSULE ("THEN"):
Title: ${capsule.title}
Sealed At: ${capsule.sealedAt}
Unlocked At: ${capsule.unlockDate}
Time Elapsed: ${eraSpan}
Letter:
${capsule.message.slice(0, 2500)}

RECENT MEMORIES ("NOW" — ${recentMemories.length} entries):
${
  recentMemories.length > 0
    ? JSON.stringify(
        recentMemories.map((m) => ({
          title: m.title,
          date: m.date,
          tags: m.tags,
          excerpt: m.content.slice(0, 450),
        })),
        null,
        2
      )
    : 'No recent journal memories recorded yet.'
}`;

  const fallback = (): CapsuleInsightOutput => {
    const thenKeywords = extractKeywords([capsule.title, capsule.message], [], 4);
    const nowKeywords = extractKeywords(
      recentMemories.map((m) => `${m.title}. ${m.content}`),
      recentMemories.flatMap((m) => m.tags),
      4
    );

    const shared = thenKeywords.filter((k) => nowKeywords.includes(k));
    const newNow = nowKeywords.filter((k) => !thenKeywords.includes(k));

    const thenSnippet = capsule.message.trim().slice(0, 140).replace(/\s+/g, ' ');
    const nowSummary =
      recentMemories.length > 0
        ? `Across ${recentMemories.length} recent journal ${recentMemories.length === 1 ? 'entry' : 'entries'} (including "${recentMemories[0].title}"), your attention has centered on ${nowKeywords.slice(0, 3).join(', ')}.`
        : 'You have not recorded recent journal memories yet—writing a reflection today will give future capsules richer context to compare against.';

    const shifts: string[] = [];
    if (shared.length > 0) {
      shifts.push(`Enduring thread: "${shared.join(', ')}" stayed present from sealing until now.`);
    }
    if (newNow.length > 0 && recentMemories.length > 0) {
      shifts.push(`New chapter focus: recent memories highlight ${newNow.slice(0, 2).join(' and ')}.`);
    }
    shifts.push(
      `Perspective check: ${eraSpan.toLowerCase()} after sealing "${capsule.title}", revisit which hopes still matter most today.`
    );

    return {
      eraLabel: eraSpan,
      thenSummary: `When you sealed "${capsule.title}", your thoughts revolved around ${thenKeywords.slice(0, 3).join(', ')} ("${thenSnippet}${capsule.message.length > 140 ? '...' : ''}").`,
      nowSummary,
      shifts: shifts.slice(0, 4),
      reflectionPrompt: `Looking back across ${eraSpan.toLowerCase()}, what surprised your past self most about where you are today?`,
    };
  };

  return generateStructuredCompletion({
    systemPrompt,
    userPrompt,
    schema: capsuleInsightOutputSchema,
    fallback,
  });
}

const CLUSTER_COLORS: BoardClusterColor[] = ['coral', 'teal', 'cobalt', 'yellow', 'pink'];

const BOARD_COMMAND_STOP_WORDS = new Set([
  'a',
  'about',
  'all',
  'an',
  'and',
  'any',
  'around',
  'arrange',
  'board',
  'by',
  'capsule',
  'capsules',
  'centered',
  'create',
  'curate',
  'entries',
  'entry',
  'every',
  'everything',
  'filter',
  'focus',
  'for',
  'from',
  'group',
  'has',
  'have',
  'highlight',
  'in',
  'into',
  'it',
  'item',
  'items',
  'just',
  'make',
  'me',
  'memories',
  'memory',
  'my',
  'of',
  'on',
  'only',
  'or',
  'organize',
  'pin',
  'pinboard',
  'related',
  'show',
  'showing',
  'stuff',
  'that',
  'the',
  'their',
  'them',
  'these',
  'this',
  'those',
  'to',
  'using',
  'vault',
  'where',
  'with',
]);

const ORGANIZATION_LENS_WORDS = new Set([
  'arc',
  'arcs',
  'chronological',
  'chronology',
  'cluster',
  'clusters',
  'color',
  'colors',
  'date',
  'dates',
  'emotion',
  'emotions',
  'feeling',
  'feelings',
  'growth',
  'life',
  'mood',
  'moods',
  'pattern',
  'patterns',
  'personal',
  'photo',
  'photos',
  'reflection',
  'reflections',
  'story',
  'stories',
  'style',
  'theme',
  'themes',
  'time',
  'timeline',
  'tone',
  'type',
  'types',
  'vibe',
  'vibes',
]);

function extractFocusTerms(focusPrompt: string): string[] {
  const rawTokens = focusPrompt.toLowerCase().match(/[a-z0-9]{2,30}/g) || [];
  return Array.from(new Set(rawTokens.filter((t) => !BOARD_COMMAND_STOP_WORDS.has(t))));
}

function itemMatchesFocusTerms(item: BoardSourceItem, terms: string[]): boolean {
  const haystack = [
    item.title,
    item.isLocked ? '' : item.excerpt,
    ...item.tags,
    item.date.slice(0, 10),
  ]
    .join(' ')
    .toLowerCase();

  return terms.some((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}`, 'i').test(haystack);
  });
}

function isTopicFilterPrompt(focusPrompt?: string): {
  isTopicFiltered: boolean;
  terms: string[];
} {
  if (!focusPrompt || !focusPrompt.trim()) {
    return { isTopicFiltered: false, terms: [] };
  }

  const trimmed = focusPrompt.trim();
  // Explicit grouping/sorting directives ("Group by ...", "Arrange by ...") apply to the whole vault
  if (/^(group|arrange|organize|categorize|sort)\s+by\b/i.test(trimmed)) {
    return { isTopicFiltered: false, terms: [] };
  }

  const terms = extractFocusTerms(trimmed);
  if (terms.length === 0) {
    return { isTopicFiltered: false, terms: [] };
  }

  const nonOrgTerms = terms.filter((t) => !ORGANIZATION_LENS_WORDS.has(t));
  if (nonOrgTerms.length === 0) {
    return { isTopicFiltered: false, terms: [] };
  }

  return { isTopicFiltered: true, terms: nonOrgTerms };
}

/**
 * Pure AI semantic relevance scorer: asks the LLM to summarize each item briefly and rate
 * relevance (1-5) against the user's focus prompt, keeping items scored >= 4.
 * Falls back to literal token matching only when no live AI endpoint is configured.
 */
async function filterBoardItemsByAi(
  items: BoardSourceItem[],
  focusPrompt: string,
  fallbackTerms: string[]
): Promise<BoardSourceItem[]> {
  const refToId = new Map<string, string>();
  const candidateSummary = items.map((item, idx) => {
    const ref = String(idx + 1);
    refToId.set(ref, item.itemId);
    refToId.set(item.itemId, item.itemId);
    return {
      ref,
      itemType: item.itemType,
      title: item.title,
      tags: item.tags,
      excerpt: item.isLocked ? '[LOCKED CAPSULE]' : item.excerpt.slice(0, 240),
    };
  });

  const literalMatches = items.filter((item) => itemMatchesFocusTerms(item, fallbackTerms));

  const filterResult = await generateStructuredCompletion({
    temperature: 0,
    systemPrompt: `Evaluate EVERY item in the list against the user's query from 1 (completely unrelated) to 5 (direct match, synonym, slang, or clear thematic association).
First write a ~5-word "about" summary for each item, then give an honest integer "score" (1-5).
Never guess contents of [LOCKED CAPSULE] items—only judge by title and tags.
Return ONLY valid JSON:
{
  "items": [
    { "ref": "1", "about": "5 word summary", "score": 1 }
  ]
}`,
    userPrompt: `Query: "${focusPrompt}"
Items:
${JSON.stringify(candidateSummary, null, 2)}`,
    schema: semanticFilterOutputSchema,
    fallback: () => ({
      items: literalMatches.map((m) => ({
        ref: m.itemId,
        itemId: m.itemId,
        about: m.title,
        score: 5,
      })),
    }),
  });

  const matchedIds = new Set<string>();
  for (const entry of filterResult.data.items) {
    if (entry.score >= 4) {
      const key = (entry.ref || entry.itemId || '').trim();
      const realId = refToId.get(key);
      if (realId) matchedIds.add(realId);
    }
  }

  // If the user literally typed a word present in an item and the model missed it, keep literal hits too
  for (const m of literalMatches) {
    matchedIds.add(m.itemId);
  }

  return items.filter((item) => matchedIds.has(item.itemId));
}

/**
 * Normalizes and repairs AI-generated board output so valid items map to valid clusters,
 * clusters get distinct colors, empty clusters are pruned, and invalid IDs are dropped.
 */
function reconcileBoardLayout(
  raw: BoardLayoutOutput,
  sourceItems: BoardSourceItem[],
  isTopicFiltered: boolean
): BoardLayoutOutput {
  const sourceMap = new Map(sourceItems.map((item) => [item.itemId, item]));
  const usedColors = new Set<BoardClusterColor>();

  const baseClusters =
    raw.clusters.length > 0
      ? raw.clusters
      : [
          {
            id: 'cluster-1',
            label: 'Curated Selection',
            color: 'coral' as BoardClusterColor,
            summary: 'Entries matching your board curation focus.',
          },
        ];

  const normalizedClusters = baseClusters.map((cluster, idx) => {
    let color = cluster.color;
    if (usedColors.has(color)) {
      const nextAvailable = CLUSTER_COLORS.find((c) => !usedColors.has(c));
      if (nextAvailable) color = nextAvailable;
    }
    usedColors.add(color);

    return {
      ...cluster,
      id: cluster.id || `cluster-${idx + 1}`,
      color,
    };
  });

  const clusterIds = new Set(normalizedClusters.map((c) => c.id));
  const fallbackClusterId = normalizedClusters[0].id;

  const seenItemIds = new Set<string>();
  const validPins = raw.pins
    .filter((pin) => {
      if (!pin.itemId || !sourceMap.has(pin.itemId) || seenItemIds.has(pin.itemId)) return false;
      seenItemIds.add(pin.itemId);
      return true;
    })
    .map((pin) => {
      const source = sourceMap.get(pin.itemId)!;
      const safePinStyle: BoardPinStyle = source.isLocked
        ? 'wax-seal'
        : source.photoCount > 0 && pin.pinStyle !== 'wax-seal'
          ? 'polaroid'
          : pin.pinStyle;

      const defaultNote = source.isLocked
        ? 'Sealed milestone awaiting its unlock date.'
        : source.tags.length > 0
          ? `Centered on #${source.tags[0]}.`
          : 'Pinned from your ECHOES archive.';

      return {
        ...pin,
        itemType: source.itemType,
        clusterId: clusterIds.has(pin.clusterId) ? pin.clusterId : fallbackClusterId,
        stickyNote: pin.stickyNote || defaultNote,
        pinStyle: safePinStyle,
        rotation: Math.max(-5, Math.min(5, Math.round(pin.rotation))),
      };
    });

  // Ensure every scoped item appears on the board (for topic-filtered boards, scopedItems already
  // contains ONLY the matching items; for unfiltered boards, it contains all vault items).
  sourceItems.forEach((item, idx) => {
    if (!seenItemIds.has(item.itemId)) {
      if (isTopicFiltered && validPins.length > 0 && raw.pins.length > 0) {
        // Respect LLM omission only if it intentionally kept a subset of matched items
        return;
      }
      const targetCluster =
        normalizedClusters[idx % normalizedClusters.length]?.id || fallbackClusterId;
      validPins.push({
        itemId: item.itemId,
        itemType: item.itemType,
        clusterId: targetCluster,
        stickyNote: item.isLocked
          ? 'Sealed milestone awaiting its unlock date.'
          : item.tags.length > 0
            ? `Tagged: ${item.tags.slice(0, 3).join(', ')}`
            : 'Pinned from your ECHOES archive.',
        rotation: ((idx % 5) - 2) * 1.5,
        pinStyle: item.itemType === 'capsule'
          ? 'wax-seal'
          : item.photoCount > 0
            ? 'polaroid'
            : 'index-card',
      });
    }
  });

  // Prune clusters with zero pins
  let populatedClusterIds = new Set(validPins.map((p) => p.clusterId));
  const workingClusters = normalizedClusters.filter((c) => populatedClusterIds.has(c.id));

  // Semantic coherence guard: prevent small models from lumping sealed capsules or
  // clearly negative/illness entries into a "Positive Emotions / Happy" cluster.
  const isPositiveCluster = (label: string, summary: string) =>
    /\b(positive|happy|joy|cheerful|uplifting|wonderful|good vibes)\b/i.test(
      `${label} ${summary}`
    );

  const hasNegativeOrRoughCue = (item: BoardSourceItem) =>
    /\b(ill|sick|bad|worst|sad|pain|shit|shat|terrible|awful|regret|cry|hurt|fail|stress|angry|anxious|miserable)\b/i.test(
      `${item.title} ${item.isLocked ? '' : item.excerpt} ${item.tags.join(' ')}`
    );

  const pickNextColor = (): BoardClusterColor => {
    const used = new Set(workingClusters.map((c) => c.color));
    return CLUSTER_COLORS.find((c) => !used.has(c)) || 'teal';
  };

  let capsuleClusterId = workingClusters.find((c) =>
    /\b(capsule|sealed|milestone|future)\b/i.test(`${c.label} ${c.summary}`)
  )?.id;

  let toughClusterId = workingClusters.find(
    (c) =>
      !isPositiveCluster(c.label, c.summary) &&
      !/\b(capsule|sealed)\b/i.test(c.label) &&
      /\b(tough|challeng|hard|difficult|health|reflect|negative|low|struggle)\b/i.test(
        `${c.label} ${c.summary}`
      )
  )?.id;

  for (const pin of validPins) {
    const source = sourceMap.get(pin.itemId);
    const assignedCluster = workingClusters.find((c) => c.id === pin.clusterId);
    if (!source || !assignedCluster) continue;

    // 1. Sealed capsules shouldn't sit inside a positive-emotion or single-bucket mood cluster
    if (
      source.isLocked &&
      (isPositiveCluster(assignedCluster.label, assignedCluster.summary) ||
        (workingClusters.length === 1 && validPins.some((p) => p.itemType === 'memory')))
    ) {
      if (!capsuleClusterId) {
        capsuleClusterId = 'cluster-capsules';
        workingClusters.push({
          id: capsuleClusterId,
          label: 'Time Capsules & Milestones',
          color: pickNextColor(),
          summary: 'Sealed messages waiting for their scheduled unlock dates.',
        });
      }
      pin.clusterId = capsuleClusterId;
      continue;
    }

    // 2. Negative/illness entries shouldn't sit inside a "Positive" cluster
    if (
      isPositiveCluster(assignedCluster.label, assignedCluster.summary) &&
      hasNegativeOrRoughCue(source)
    ) {
      if (!toughClusterId) {
        toughClusterId = 'cluster-challenging';
        workingClusters.push({
          id: toughClusterId,
          label: 'Rough Days & Reflections',
          color: pickNextColor(),
          summary: 'Challenging moments, health notes, and candid lows.',
        });
      }
      pin.clusterId = toughClusterId;
      if (/\b(positive|joy|happy|appreciate)\b/i.test(pin.stickyNote)) {
        pin.stickyNote =
          source.tags.length > 0
            ? `Candid moment tagged ${source.tags.map((t) => `#${t}`).join(', ')}.`
            : 'Candid reflection from a rough moment.';
      }
    }
  }

  populatedClusterIds = new Set(validPins.map((p) => p.clusterId));
  const populatedClusters = workingClusters.filter((c) => populatedClusterIds.has(c.id));

  const pinnedIds = new Set(validPins.map((p) => p.itemId));
  const validConnections = raw.connections.filter(
    (conn) =>
      conn.fromItemId &&
      conn.toItemId &&
      conn.fromItemId !== conn.toItemId &&
      pinnedIds.has(conn.fromItemId) &&
      pinnedIds.has(conn.toItemId)
  );

  return {
    boardTitle: raw.boardTitle,
    curatorNote: raw.curatorNote,
    clusters: populatedClusters,
    pins: validPins,
    connections: validConnections,
  };
}

/**
 * 3. AI-Arranged Clustered Bento Pinboard
 */
export async function generateMemoryBoardLayout(params: {
  items: BoardSourceItem[];
  focusPrompt?: string;
}): Promise<AiCompletionResult<BoardLayoutOutput>> {
  const { items, focusPrompt } = params;
  const { isTopicFiltered, terms } = isTopicFilterPrompt(focusPrompt);
  const scopedItems =
    isTopicFiltered && focusPrompt
      ? await filterBoardItemsByAi(items, focusPrompt, terms)
      : items;

  if (isTopicFiltered && scopedItems.length === 0) {
    return {
      mode: isLiveAiConfigured() ? 'ai' : 'heuristic',
      model: 'echoes-focus-filter',
      data: {
        boardTitle: `No Matches for "${focusPrompt}"`,
        curatorNote: `None of your ${items.length} memories or unlocked capsules matched "${focusPrompt}". Clear the focus field or try a broader keyword to arrange your vault.`,
        clusters: [],
        pins: [],
        connections: [],
      },
    };
  }

  const refToRealId = new Map<string, string>();
  const promptItems = scopedItems.map((item, idx) => {
    const ref = String(idx + 1);
    refToRealId.set(ref, item.itemId);
    refToRealId.set(item.itemId, item.itemId);
    return {
      itemId: ref,
      itemType: item.itemType,
      title: item.title,
      date: item.date,
      tags: item.tags,
      photoCount: item.photoCount,
      isLocked: item.isLocked,
      excerpt: item.isLocked ? '[LOCKED CAPSULE — DO NOT INVENT CONTENT]' : item.excerpt.slice(0, 320),
    };
  });

  const clusterGuidance =
    scopedItems.length <= 2
      ? 'Create 1 cohesive cluster for these matching items.'
      : 'Group these itemIds into 2 to 4 DISTINCT thematic clusters with different colors. NEVER place negative, illness, or difficult items inside a "Positive" cluster, and put locked capsules in their own milestone/capsule cluster.';

  const systemPrompt = `You are the visual curator of ECHOES, arranging a user's memories, photos, and time capsules onto a thematic bulletin pinboard.
${clusterGuidance}
Only reference itemIds provided in the input below. Never invent items or force unrelated topics.
Every pin MUST include a non-null string clusterId matching one of the cluster ids in clusters (even for locked capsules).
For every item, write a short, insightful stickyNote (max 18 words) explaining why it belongs in that cluster, and choose a fitting pinStyle ('polaroid' if photoCount > 0, 'wax-seal' for capsules, 'index-card' or 'sticky' for journal entries) and subtle rotation between -4 and 4.
Only add "connections" when 2 or more items genuinely share a real theme.
Never reveal or guess content for items where isLocked is true.
Return ONLY valid JSON matching:
{
  "boardTitle": "Curated board title",
  "curatorNote": "1-2 sentence overview of how the board was organized",
  "clusters": [
    { "id": "cluster-1", "label": "Bright Moments", "color": "coral", "summary": "Short cluster description" },
    { "id": "cluster-2", "label": "Rough Days & Milestones", "color": "teal", "summary": "Short cluster description" }
  ],
  "pins": [
    { "itemId": "...", "itemType": "memory|capsule", "clusterId": "cluster-1", "stickyNote": "...", "rotation": -2, "pinStyle": "polaroid|index-card|wax-seal|sticky" }
  ],
  "connections": [
    { "fromItemId": "...", "toItemId": "...", "reason": "Short connection reason" }
  ]
}`;

  const userPrompt = `${focusPrompt ? `User Curator Focus: "${focusPrompt}"\n\n` : ''}Matching Vault Items (${promptItems.length}):
${JSON.stringify(promptItems, null, 2)}`;

  const fallback = (): BoardLayoutOutput => {
    const tagCounts = new Map<string, number>();
    for (const item of scopedItems) {
      for (const tag of item.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    const topTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);

    const clusters: BoardLayoutOutput['clusters'] = [];
    const tagToClusterId = new Map<string, string>();

    topTags.forEach((tag, idx) => {
      const cid = `cluster-${idx + 1}`;
      tagToClusterId.set(tag, cid);
      clusters.push({
        id: cid,
        label: tag.charAt(0).toUpperCase() + tag.slice(1),
        color: CLUSTER_COLORS[idx % CLUSTER_COLORS.length],
        summary: `Moments and reflections connected by #${tag}.`,
      });
    });

    const hasCapsules = scopedItems.some((i) => i.itemType === 'capsule');
    const capsuleClusterId = hasCapsules ? `cluster-capsules` : '';
    if (hasCapsules) {
      clusters.push({
        id: capsuleClusterId,
        label: 'Time Capsules & Milestones',
        color: 'cobalt',
        summary: 'Letters across time—sealed milestones and unsealed reflections.',
      });
    }

    const generalClusterId = 'cluster-chronicles';
    if (
      clusters.length === 0 ||
      scopedItems.some((i) => i.itemType === 'memory' && !i.tags.some((t) => tagToClusterId.has(t)))
    ) {
      clusters.push({
        id: generalClusterId,
        label: clusters.length === 0 ? 'Personal Archive' : 'Everyday Reflections',
        color: 'teal',
        summary: 'Candid snapshots, everyday stories, and standalone vault entries.',
      });
    }

    const pins: BoardLayoutOutput['pins'] = scopedItems.map((item, idx) => {
      let clusterId = clusters[0].id;
      if (item.itemType === 'capsule' && capsuleClusterId) {
        clusterId = capsuleClusterId;
      } else {
        const matchedTag = item.tags.find((t) => tagToClusterId.has(t));
        if (matchedTag) {
          clusterId = tagToClusterId.get(matchedTag)!;
        } else if (clusters.some((c) => c.id === generalClusterId)) {
          clusterId = generalClusterId;
        }
      }

      const pinStyle: BoardPinStyle =
        item.itemType === 'capsule'
          ? 'wax-seal'
          : item.photoCount > 0
            ? 'polaroid'
            : idx % 3 === 0
              ? 'sticky'
              : 'index-card';

      return {
        itemId: item.itemId,
        itemType: item.itemType,
        clusterId,
        stickyNote: item.isLocked
          ? `Sealed until ${new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`
          : item.photoCount > 0
            ? `Visual memory with ${item.photoCount} photo${item.photoCount > 1 ? 's' : ''}.`
            : item.tags.length > 0
              ? `Centered on #${item.tags[0]}.`
              : `Recorded on ${new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}.`,
        rotation: ((idx % 5) - 2) * 1.2,
        pinStyle,
      };
    });

    // Build meaningful tag/temporal connections
    const connections: BoardLayoutOutput['connections'] = [];
    for (let i = 0; i < scopedItems.length && connections.length < 6; i++) {
      for (let j = i + 1; j < scopedItems.length && connections.length < 6; j++) {
        const sharedTag = scopedItems[i].tags.find((t) => scopedItems[j].tags.includes(t));
        if (sharedTag) {
          connections.push({
            fromItemId: scopedItems[i].itemId,
            toItemId: scopedItems[j].itemId,
            reason: `Shared theme: #${sharedTag}`,
          });
        }
      }
    }

    if (connections.length === 0 && scopedItems.length >= 2) {
      connections.push({
        fromItemId: scopedItems[0].itemId,
        toItemId: scopedItems[1].itemId,
        reason: 'Adjacent entries in your archive timeline',
      });
    }

    return {
      boardTitle: focusPrompt
        ? `Curated Pinboard: ${focusPrompt.slice(0, 60)}`
        : 'ECHOES Memory & Capsule Pinboard',
      curatorNote: `Organized ${scopedItems.length} matching vault ${scopedItems.length === 1 ? 'entry' : 'entries'} across ${clusters.length} thematic cluster${clusters.length > 1 ? 's' : ''}.`,
      clusters: clusters.slice(0, 6),
      pins,
      connections,
    };
  };

  const result = await generateStructuredCompletion({
    systemPrompt,
    userPrompt,
    schema: boardLayoutOutputSchema,
    fallback,
  });

  // Map short prompt refs ("1", "2", ...) back to real MongoDB ObjectIds
  const resolvedLayout: BoardLayoutOutput = {
    ...result.data,
    pins: result.data.pins.map((p) => ({
      ...p,
      itemId: refToRealId.get(p.itemId) || p.itemId,
    })),
    connections: result.data.connections.map((c) => ({
      ...c,
      fromItemId: refToRealId.get(c.fromItemId) || c.fromItemId,
      toItemId: refToRealId.get(c.toItemId) || c.toItemId,
    })),
  };

  return {
    ...result,
    data: reconcileBoardLayout(resolvedLayout, scopedItems, isTopicFiltered),
  };
}

