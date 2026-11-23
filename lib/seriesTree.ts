import type { Lesson, Series } from "./types";

export interface SeriesTreeNode {
  series: Series;
  depth: number;
  children: SeriesTreeNode[];
}

export interface FlattenedSeriesItem {
  series: Series;
  depth: number;
  path: Series[];
  pathLabel: string;
}

/**
 * Normalize parentId (treats undefined / empty string / missing parent as null).
 */
export function getValidParentId(series: Series, seriesMap: Map<string, Series>): string | null {
  const pid = series.parentId || null;
  if (!pid || pid === series.id || !seriesMap.has(pid)) return null;
  return pid;
}

/**
 * Build a hierarchical tree of series sorted by sortOrder and createdAt.
 */
export function buildSeriesTree(seriesList: Series[]): SeriesTreeNode[] {
  const map = new Map<string, Series>();
  seriesList.forEach((s) => map.set(s.id, s));

  const childrenMap = new Map<string | null, Series[]>();
  for (const s of seriesList) {
    const pid = getValidParentId(s, map);
    const list = childrenMap.get(pid) || [];
    list.push(s);
    childrenMap.set(pid, list);
  }

  const sortFn = (a: Series, b: Series) =>
    a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt);

  const visited = new Set<string>();

  const buildNodes = (parentId: string | null, depth: number): SeriesTreeNode[] => {
    const items = (childrenMap.get(parentId) || []).slice().sort(sortFn);
    const nodes: SeriesTreeNode[] = [];
    for (const s of items) {
      if (visited.has(s.id)) continue;
      visited.add(s.id);
      nodes.push({
        series: s,
        depth,
        children: buildNodes(s.id, depth + 1),
      });
    }
    return nodes;
  };

  const roots = buildNodes(null, 0);

  // Safety net: if any series was part of a cycle, append it at root level
  for (const s of seriesList) {
    if (!visited.has(s.id)) {
      visited.add(s.id);
      roots.push({ series: s, depth: 0, children: [] });
    }
  }

  return roots;
}

/**
 * Flatten tree in pre-order traversal with depth and breadcrumb path.
 */
export function flattenSeriesTree(seriesList: Series[]): FlattenedSeriesItem[] {
  const tree = buildSeriesTree(seriesList);
  const result: FlattenedSeriesItem[] = [];

  const walk = (nodes: SeriesTreeNode[], ancestors: Series[]) => {
    for (const node of nodes) {
      const path = [...ancestors, node.series];
      result.push({
        series: node.series,
        depth: node.depth,
        path,
        pathLabel: path.map((p) => p.title).join(" › "),
      });
      walk(node.children, path);
    }
  };

  walk(tree, []);
  return result;
}

/**
 * Get ancestor chain from root down to direct parent (excluding the series itself).
 */
export function getSeriesAncestors(seriesList: Series[], seriesId: string): Series[] {
  const map = new Map<string, Series>();
  seriesList.forEach((s) => map.set(s.id, s));

  const ancestors: Series[] = [];
  const seen = new Set<string>([seriesId]);
  let current = map.get(seriesId);

  while (current?.parentId && !seen.has(current.parentId)) {
    const parent = map.get(current.parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    seen.add(parent.id);
    current = parent;
  }

  return ancestors;
}

/**
 * Get full path label for a series id, e.g. "تفسير القرآن › سورة البقرة".
 */
export function getSeriesPathLabel(seriesList: Series[], seriesId: string | null): string {
  if (!seriesId) return "درس مفرد";
  const map = new Map<string, Series>();
  seriesList.forEach((s) => map.set(s.id, s));
  const current = map.get(seriesId);
  if (!current) return "—";
  const ancestors = getSeriesAncestors(seriesList, seriesId);
  return [...ancestors, current].map((s) => s.title).join(" › ");
}

/**
 * Get a Set containing rootId and all descendant series IDs recursively.
 */
export function getDescendantSeriesIds(seriesList: Series[], rootId: string): Set<string> {
  const result = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const s of seriesList) {
      if (s.parentId && result.has(s.parentId) && !result.has(s.id)) {
        result.add(s.id);
        changed = true;
      }
    }
  }
  return result;
}

/**
 * Get direct children of a given series sorted by sortOrder.
 */
export function getDirectChildSeries(seriesList: Series[], parentId: string): Series[] {
  return seriesList
    .filter((s) => (s.parentId || null) === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt));
}

/**
 * Compute recursive stats (total lessons & total duration) for a series including all sub-series.
 */
export function getRecursiveSeriesStats(
  seriesList: Series[],
  lessons: Lesson[],
  seriesId: string
): {
  directLessonsCount: number;
  totalLessonsCount: number;
  totalSeconds: number;
  directChildrenCount: number;
  totalDescendantsCount: number;
} {
  const descendantIds = getDescendantSeriesIds(seriesList, seriesId);
  let directLessonsCount = 0;
  let totalLessonsCount = 0;
  let totalSeconds = 0;

  for (const l of lessons) {
    if (!l.seriesId) continue;
    if (l.seriesId === seriesId) {
      directLessonsCount += 1;
    }
    if (descendantIds.has(l.seriesId)) {
      totalLessonsCount += 1;
      totalSeconds += l.durationSeconds || 0;
    }
  }

  const directChildrenCount = seriesList.filter((s) => (s.parentId || null) === seriesId).length;
  const totalDescendantsCount = Math.max(0, descendantIds.size - 1);

  return {
    directLessonsCount,
    totalLessonsCount,
    totalSeconds,
    directChildrenCount,
    totalDescendantsCount,
  };
}
