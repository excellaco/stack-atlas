import { resolveItemName } from "../utils/diff";
import type { EnrichedItem } from "../types";

interface DiffData {
  stackAdded: string[];
  stackRemoved: string[];
  providersAdded: string[];
  providersRemoved: string[];
  subsystemsAdded: { id: string; name: string }[];
  subsystemsRemoved: { id: string; name: string }[];
  subsystemsChanged: {
    id: string;
    name: string;
    additionsAdded: string[];
    additionsRemoved: string[];
    exclusionsAdded: string[];
    exclusionsRemoved: string[];
  }[];
}

interface StackDiffSectionProps {
  diff: DiffData;
  itemsById: Map<string, EnrichedItem>;
}

export function StackDiffSection({
  diff,
  itemsById,
}: Readonly<StackDiffSectionProps>): React.JSX.Element | null {
  if (!diff.stackAdded.length && !diff.stackRemoved.length) return null;
  return (
    <>
      <div className="diff-section">Stack</div>
      {diff.stackAdded.map((id) => (
        <div key={`+${id}`} className="diff-added">
          {resolveItemName(id, itemsById)}
        </div>
      ))}
      {diff.stackRemoved.map((id) => (
        <div key={`-${id}`} className="diff-removed">
          {resolveItemName(id, itemsById)}
        </div>
      ))}
    </>
  );
}

interface ProviderDiffSectionProps {
  diff: DiffData;
}

export function ProviderDiffSection({
  diff,
}: Readonly<ProviderDiffSectionProps>): React.JSX.Element | null {
  if (!diff.providersAdded.length && !diff.providersRemoved.length) return null;
  return (
    <>
      <div className="diff-section">Cloud Providers</div>
      {diff.providersAdded.map((p) => (
        <div key={`+p-${p}`} className="diff-added">
          {p.toUpperCase()}
        </div>
      ))}
      {diff.providersRemoved.map((p) => (
        <div key={`-p-${p}`} className="diff-removed">
          {p.toUpperCase()}
        </div>
      ))}
    </>
  );
}

interface SubsystemAddRemoveSectionProps {
  diff: DiffData;
  subId: string | undefined;
}

export function SubsystemAddRemoveSection({
  diff,
  subId,
}: Readonly<SubsystemAddRemoveSectionProps>): React.JSX.Element {
  return (
    <>
      {!subId &&
        diff.subsystemsAdded.map((sub) => (
          <div key={`+sub-${sub.id}`}>
            <div className="diff-section">Subsystem: {sub.name}</div>
            <div className="diff-added">added</div>
          </div>
        ))}
      {!subId &&
        diff.subsystemsRemoved.map((sub) => (
          <div key={`-sub-${sub.id}`}>
            <div className="diff-section">Subsystem: {sub.name}</div>
            <div className="diff-removed">removed</div>
          </div>
        ))}
      {subId &&
        diff.subsystemsAdded
          .filter((s) => s.id === subId)
          .map((sub) => (
            <div key={`+sub-${sub.id}`} className="diff-added">
              subsystem created
            </div>
          ))}
      {subId &&
        diff.subsystemsRemoved
          .filter((s) => s.id === subId)
          .map((sub) => (
            <div key={`-sub-${sub.id}`} className="diff-removed">
              subsystem removed
            </div>
          ))}
    </>
  );
}

interface SubsystemChangedSectionProps {
  diff: DiffData;
  subId: string | undefined;
  itemsById: Map<string, EnrichedItem>;
}

export function SubsystemChangedSection({
  diff,
  subId,
  itemsById,
}: Readonly<SubsystemChangedSectionProps>): React.JSX.Element | null {
  const filtered = diff.subsystemsChanged.filter((sub) => !subId || sub.id === subId);
  if (!filtered.length) return null;
  return (
    <>
      {filtered.map((sub) => (
        <div key={`~sub-${sub.id}`}>
          {!subId && <div className="diff-section">Subsystem: {sub.name}</div>}
          {sub.additionsAdded.map((id) => (
            <div key={`+a-${id}`} className="diff-added">
              {resolveItemName(id, itemsById)}
            </div>
          ))}
          {sub.additionsRemoved.map((id) => (
            <div key={`-a-${id}`} className="diff-removed">
              {resolveItemName(id, itemsById)}
            </div>
          ))}
          {sub.exclusionsAdded.map((id) => (
            <div key={`+e-${id}`} className="diff-added">
              exclusion: {resolveItemName(id, itemsById)}
            </div>
          ))}
          {sub.exclusionsRemoved.map((id) => (
            <div key={`-e-${id}`} className="diff-removed">
              exclusion: {resolveItemName(id, itemsById)}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
