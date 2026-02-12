import type { CommitSnapshot, EnrichedItem } from "../types";

export const getParentName = (
  item: EnrichedItem,
  itemsById: Map<string, EnrichedItem>
): string | null => {
  const parentId = item.parents?.[0];
  if (!parentId) return null;
  return itemsById.get(parentId)?.name ?? null;
};

// --- Helpers for set-based diffing ---

interface SetDiff {
  added: string[];
  removed: string[];
}

function diffSets(prevSet: Set<string>, currSet: Set<string>): SetDiff {
  const added = [...currSet].filter((x) => !prevSet.has(x));
  const removed = [...prevSet].filter((x) => !currSet.has(x));
  return { added, removed };
}

interface StackDiff {
  stackAdded: string[];
  stackRemoved: string[];
  providersAdded: string[];
  providersRemoved: string[];
}

function computeStackDiff(
  prevSnapshot: CommitSnapshot | null | undefined,
  currSnapshot: CommitSnapshot | null | undefined
): StackDiff {
  const prevStack = new Set(prevSnapshot?.stack || []);
  const currStack = new Set(currSnapshot?.stack || []);
  const { added: stackAdded, removed: stackRemoved } = diffSets(prevStack, currStack);

  const prevProviders = new Set(prevSnapshot?.providers || []);
  const currProviders = new Set(currSnapshot?.providers || []);
  const { added: providersAdded, removed: providersRemoved } = diffSets(
    prevProviders,
    currProviders
  );

  return { stackAdded, stackRemoved, providersAdded, providersRemoved };
}

interface SubsystemFieldData {
  additions?: string[];
  exclusions?: string[];
  name?: string;
}

function diffSubsystemField(
  prev: SubsystemFieldData,
  curr: SubsystemFieldData,
  field: "additions" | "exclusions"
): SetDiff {
  return diffSets(new Set(prev[field] || []), new Set(curr[field] || []));
}

interface SubsystemChange {
  id: string;
  name: string;
  additionsAdded: string[];
  additionsRemoved: string[];
  exclusionsAdded: string[];
  exclusionsRemoved: string[];
}

function computeSingleSubsystemChange(
  id: string,
  prevSubs: Record<string, SubsystemFieldData>,
  currSubs: Record<string, SubsystemFieldData>
): SubsystemChange | null {
  const prev = prevSubs[id] || {};
  const curr = currSubs[id] || {};
  const additions = diffSubsystemField(prev, curr, "additions");
  const exclusions = diffSubsystemField(prev, curr, "exclusions");
  const totalChanges =
    additions.added.length +
    additions.removed.length +
    exclusions.added.length +
    exclusions.removed.length;
  if (!totalChanges) return null;
  return {
    id,
    name: curr.name || id,
    additionsAdded: additions.added,
    additionsRemoved: additions.removed,
    exclusionsAdded: exclusions.added,
    exclusionsRemoved: exclusions.removed,
  };
}

interface SubsystemRef {
  id: string;
  name: string;
}

interface SubsystemChanges {
  subsystemsAdded: SubsystemRef[];
  subsystemsRemoved: SubsystemRef[];
  subsystemsChanged: SubsystemChange[];
}

function computeSubsystemChanges(
  prevSnapshot: CommitSnapshot | null | undefined,
  currSnapshot: CommitSnapshot | null | undefined
): SubsystemChanges {
  const prevSubs: Record<string, SubsystemFieldData> = prevSnapshot?.subsystems || {};
  const currSubs: Record<string, SubsystemFieldData> = currSnapshot?.subsystems || {};
  const prevSubIds = new Set(Object.keys(prevSubs));
  const currSubIds = new Set(Object.keys(currSubs));

  const subsystemsAdded: SubsystemRef[] = [...currSubIds]
    .filter((id) => !prevSubIds.has(id))
    .map((id) => ({ id, name: currSubs[id]?.name || id }));

  const subsystemsRemoved: SubsystemRef[] = [...prevSubIds]
    .filter((id) => !currSubIds.has(id))
    .map((id) => ({ id, name: prevSubs[id]?.name || id }));

  const subsystemsChanged: SubsystemChange[] = [...currSubIds]
    .filter((id) => prevSubIds.has(id))
    .map((id) => computeSingleSubsystemChange(id, prevSubs, currSubs))
    .filter((c): c is SubsystemChange => c != null);

  return { subsystemsAdded, subsystemsRemoved, subsystemsChanged };
}

// --- Main diff function ---

export type CommitDiff = StackDiff & SubsystemChanges;

export const computeDiff = (
  prevSnapshot: CommitSnapshot | null | undefined,
  currSnapshot: CommitSnapshot | null | undefined
): CommitDiff => {
  const stackDiff = computeStackDiff(prevSnapshot, currSnapshot);
  const subDiff = computeSubsystemChanges(prevSnapshot, currSnapshot);
  return { ...stackDiff, ...subDiff };
};

export const resolveItemName = (id: string, itemsById: Map<string, EnrichedItem>): string => {
  const item = itemsById.get(id);
  return item ? `${item.name} (${item.type})` : id;
};

export const formatTimeAgo = (timestamp: string): string => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
