// FilterPanel — left column of the Editor, provides all filter controls.
//
// Cloud Provider filter:
//   Provider IDs ("aws", "azure", "gcp") match against item tags. This is a
//   deliberate design choice — cloud provider affinity is expressed as tags on
//   catalog items rather than a separate field, keeping the data model flat.
//   The PROVIDERS constant here mirrors PROVIDER_IDS in useEditorState.ts.
//
// Filter behaviors:
//   - Categories, Providers, Types: OR within group (match any selected)
//   - Tags: AND within group (match ALL selected) — note "Tags (match all)" label
//   - Search: matches against name, description, synonyms, category name, tags
//
// Counts (useFilterCounts) show how many catalog items belong to each filter
// value, helping users understand the catalog distribution before filtering.
import { useMemo } from "react";
import { useStore } from "../store";
import { toggleInList } from "../utils/search";
import {
  selectCatalogItems,
  selectCategoryCounts,
  selectTagCounts,
  selectTagList,
} from "../store/selectors";
import type { Category } from "../types";

interface ProviderItem {
  id: string;
  label: string;
}

// These IDs correspond to tag values on catalog items. See useEditorState.ts
// PROVIDER_IDS for the matching filter logic.
const PROVIDERS: ProviderItem[] = [
  { id: "aws", label: "AWS" },
  { id: "azure", label: "Azure" },
  { id: "gcp", label: "GCP" },
];

interface FilterHeadingProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FilterHeading({
  title,
  isOpen,
  onToggle,
}: Readonly<FilterHeadingProps>): React.JSX.Element {
  return (
    <div className="filter-heading">
      <div className="filter-title">{title}</div>
      <button type="button" className="filter-toggle" aria-expanded={isOpen} onClick={onToggle}>
        {isOpen ? "\u2212" : "+"}
      </button>
    </div>
  );
}

type ChipItem = string | Category | ProviderItem;

interface ChipListProps {
  items: ChipItem[];
  selectedList: string[];
  onToggle: (id: string) => void;
  counts?: Record<string, number>;
}

function ChipList({
  items,
  selectedList,
  onToggle,
  counts,
}: Readonly<ChipListProps>): React.JSX.Element {
  return (
    <div className="chip-grid">
      {items.map((raw) => {
        const id = typeof raw === "string" ? raw : raw.id;
        const label =
          typeof raw === "string" ? raw : (raw as ProviderItem).label || (raw as Category).name;
        const isCat = typeof raw !== "string" && "id" in raw && !("label" in raw);
        return (
          <button
            key={id}
            type="button"
            className="chip"
            data-active={selectedList.includes(id) || undefined}
            data-category={isCat ? id : undefined}
            onClick={() => onToggle(id)}
          >
            {label}
            {counts && counts[id] != null && <span className="chip-count">{counts[id]}</span>}
          </button>
        );
      })}
    </div>
  );
}

interface FilterBlockProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  items: ChipItem[];
  selectedList: string[];
  onChipToggle: (id: string) => void;
  counts?: Record<string, number>;
}

function FilterBlock({
  title,
  isOpen,
  onToggle,
  items,
  selectedList,
  onChipToggle,
  counts,
}: Readonly<FilterBlockProps>): React.JSX.Element {
  return (
    <div className="filter-block">
      <FilterHeading title={title} isOpen={isOpen} onToggle={onToggle} />
      {isOpen && (
        <ChipList
          items={items}
          selectedList={selectedList}
          onToggle={onChipToggle}
          counts={counts}
        />
      )}
    </div>
  );
}

function useFilterCounts(): {
  categoryCounts: Record<string, number>;
  tagCounts: Record<string, number>;
  tagList: string[];
} {
  const catalogRawItems = useStore((s) => s.catalogRawItems);
  const catalogDescriptions = useStore((s) => s.catalogDescriptions);

  const catalogItems = useMemo(
    () =>
      selectCatalogItems({ catalogRawItems, catalogDescriptions } as Parameters<
        typeof selectCatalogItems
      >[0]),
    [catalogRawItems, catalogDescriptions]
  );
  const categoryCounts = useMemo(() => selectCategoryCounts(catalogItems), [catalogItems]);
  const tagCounts = useMemo(() => selectTagCounts(catalogItems), [catalogItems]);
  const tagList = useMemo(() => selectTagList(tagCounts), [tagCounts]);

  return { categoryCounts, tagCounts, tagList };
}

function useFilterStore() {
  return {
    query: useStore((s) => s.query),
    setQuery: useStore((s) => s.setQuery),
    resetFilters: useStore((s) => s.resetFilters),
    catalogCategories: useStore((s) => s.catalogCategories),
    catalogTypes: useStore((s) => s.catalogTypes),
    selectedCategories: useStore((s) => s.selectedCategories),
    toggleCategory: useStore((s) => s.toggleCategory),
    selectedTypes: useStore((s) => s.selectedTypes),
    toggleType: useStore((s) => s.toggleType),
    selectedTags: useStore((s) => s.selectedTags),
    toggleTag: useStore((s) => s.toggleTag),
    selectedProviders: useStore((s) => s.selectedProviders),
    setSelectedProviders: useStore((s) => s.setSelectedProviders),
    isCategoriesOpen: useStore((s) => s.isCategoriesOpen),
    setIsCategoriesOpen: useStore((s) => s.setIsCategoriesOpen),
    isProvidersOpen: useStore((s) => s.isProvidersOpen),
    setIsProvidersOpen: useStore((s) => s.setIsProvidersOpen),
    isTypesOpen: useStore((s) => s.isTypesOpen),
    setIsTypesOpen: useStore((s) => s.setIsTypesOpen),
    isTagsOpen: useStore((s) => s.isTagsOpen),
    setIsTagsOpen: useStore((s) => s.setIsTagsOpen),
  };
}

type FilterStoreReturn = ReturnType<typeof useFilterStore>;
type FilterCountsReturn = ReturnType<typeof useFilterCounts>;

interface FilterBlocksProps {
  s: FilterStoreReturn;
  counts: FilterCountsReturn;
}

function FilterBlocks({ s, counts }: Readonly<FilterBlocksProps>): React.JSX.Element {
  return (
    <>
      <FilterBlock
        title="Categories"
        isOpen={s.isCategoriesOpen}
        onToggle={() => s.setIsCategoriesOpen((p: boolean) => !p)}
        items={s.catalogCategories}
        selectedList={s.selectedCategories}
        onChipToggle={s.toggleCategory}
        counts={counts.categoryCounts}
      />
      <FilterBlock
        title="Cloud Provider"
        isOpen={s.isProvidersOpen}
        onToggle={() => s.setIsProvidersOpen((p: boolean) => !p)}
        items={PROVIDERS}
        selectedList={s.selectedProviders}
        onChipToggle={(id: string) =>
          s.setSelectedProviders((prev: string[]) => toggleInList(prev, id))
        }
        counts={counts.tagCounts}
      />
      <FilterBlock
        title="Types"
        isOpen={s.isTypesOpen}
        onToggle={() => s.setIsTypesOpen((p: boolean) => !p)}
        items={s.catalogTypes}
        selectedList={s.selectedTypes}
        onChipToggle={s.toggleType}
      />
      <FilterBlock
        title="Tags (match all)"
        isOpen={s.isTagsOpen}
        onToggle={() => s.setIsTagsOpen((p: boolean) => !p)}
        items={counts.tagList}
        selectedList={s.selectedTags}
        onChipToggle={s.toggleTag}
        counts={counts.tagCounts}
      />
    </>
  );
}

export default function FilterPanel(): React.JSX.Element {
  const s = useFilterStore();
  const counts = useFilterCounts();

  return (
    <aside className="filters-panel">
      <div className="panel-header">
        <h3>Filters</h3>
        <button type="button" className="ghost" onClick={s.resetFilters}>
          Clear
        </button>
      </div>
      <label className="field">
        <span>Search</span>
        <input
          type="search"
          placeholder="Search by name, description, or tag"
          value={s.query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => s.setQuery(e.target.value)}
        />
      </label>
      <FilterBlocks s={s} counts={counts} />
    </aside>
  );
}
