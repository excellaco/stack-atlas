import { useMemo } from "react";
import { useStore } from "../store";
import { toggleInList } from "../utils/search";
import {
  selectCatalogItems,
  selectCategoryCounts,
  selectTagCounts,
  selectTagList,
} from "../store/selectors";

const PROVIDERS = [
  { id: "aws", label: "AWS" },
  { id: "azure", label: "Azure" },
  { id: "gcp", label: "GCP" },
];

function FilterHeading({ title, isOpen, onToggle }) {
  return (
    <div className="filter-heading">
      <div className="filter-title">{title}</div>
      <button type="button" className="filter-toggle" aria-expanded={isOpen} onClick={onToggle}>
        {isOpen ? "\u2212" : "+"}
      </button>
    </div>
  );
}

function ChipList({ items, selectedList, onToggle, counts }) {
  return (
    <div className="chip-grid">
      {items.map((raw) => {
        const id = typeof raw === "string" ? raw : raw.id;
        const label = typeof raw === "string" ? raw : raw.label || raw.name;
        const isCat = typeof raw !== "string" && raw.id && !raw.label;
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

function FilterBlock({ title, isOpen, onToggle, items, selectedList, onChipToggle, counts }) {
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

function useFilterCounts() {
  const catalogRawItems = useStore((s) => s.catalogRawItems);
  const catalogDescriptions = useStore((s) => s.catalogDescriptions);

  const catalogItems = useMemo(
    () => selectCatalogItems({ catalogRawItems, catalogDescriptions }),
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

function FilterBlocks({ s, counts }) {
  return (
    <>
      <FilterBlock
        title="Categories"
        isOpen={s.isCategoriesOpen}
        onToggle={() => s.setIsCategoriesOpen((p) => !p)}
        items={s.catalogCategories}
        selectedList={s.selectedCategories}
        onChipToggle={s.toggleCategory}
        counts={counts.categoryCounts}
      />
      <FilterBlock
        title="Cloud Provider"
        isOpen={s.isProvidersOpen}
        onToggle={() => s.setIsProvidersOpen((p) => !p)}
        items={PROVIDERS}
        selectedList={s.selectedProviders}
        onChipToggle={(id) => s.setSelectedProviders((prev) => toggleInList(prev, id))}
        counts={counts.tagCounts}
      />
      <FilterBlock
        title="Types"
        isOpen={s.isTypesOpen}
        onToggle={() => s.setIsTypesOpen((p) => !p)}
        items={s.catalogTypes}
        selectedList={s.selectedTypes}
        onChipToggle={s.toggleType}
      />
      <FilterBlock
        title="Tags (match all)"
        isOpen={s.isTagsOpen}
        onToggle={() => s.setIsTagsOpen((p) => !p)}
        items={s.tagList || counts.tagList}
        selectedList={s.selectedTags}
        onChipToggle={s.toggleTag}
        counts={counts.tagCounts}
      />
    </>
  );
}

export default function FilterPanel() {
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
          onChange={(e) => s.setQuery(e.target.value)}
        />
      </label>
      <FilterBlocks s={s} counts={counts} />
    </aside>
  );
}
