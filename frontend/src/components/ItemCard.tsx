import { getParentName } from "../utils/diff";
import type { EnrichedItem } from "../types";

interface ItemTagsProps {
  tags?: string[];
}

function ItemTags({ tags }: Readonly<ItemTagsProps>): React.JSX.Element | null {
  if (!tags?.length) return null;
  return (
    <div className="item-tags">
      {tags.map((tag) => (
        <span key={tag} className="tag">
          {tag}
        </span>
      ))}
    </div>
  );
}

interface CommonItemsProps {
  items: EnrichedItem[];
  addItems: (ids: string[]) => void;
}

function CommonItems({ items, addItems }: Readonly<CommonItemsProps>): React.JSX.Element | null {
  if (!items.length) return null;
  return (
    <div className="item-common">
      <span>Common together:</span>
      <div className="common-list">
        {items.map((common) => (
          <button
            key={common.id}
            type="button"
            className="chip"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              addItems([common.id]);
            }}
          >
            + {common.name}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ItemMetaOverlayProps {
  item: EnrichedItem;
  parentName: string | null | undefined;
  commonItems: EnrichedItem[];
  addItems: (ids: string[]) => void;
}

function ItemMetaOverlay({
  item,
  parentName,
  commonItems,
  addItems,
}: Readonly<ItemMetaOverlayProps>): React.JSX.Element {
  return (
    <div
      className="item-meta-overlay"
      onClick={(event: React.MouseEvent) => event.stopPropagation()}
    >
      {item.description && <div className="item-description">{item.description}</div>}
      {parentName && <div className="item-parent">Parent: {parentName}</div>}
      {item.synonyms && item.synonyms.length > 0 && (
        <div className="item-synonyms">Also known as: {item.synonyms.join(", ")}</div>
      )}
      <ItemTags tags={item.tags} />
      <CommonItems items={commonItems} addItems={addItems} />
    </div>
  );
}

function hasItemMetadata(
  item: EnrichedItem,
  parentName: string | null | undefined,
  commonItems: EnrichedItem[]
): boolean {
  return !!(
    item.description ||
    parentName ||
    item.synonyms?.length ||
    item.tags?.length ||
    commonItems.length
  );
}

interface ItemMainRowProps {
  item: EnrichedItem;
  hasMetadata: boolean;
  isInherited: boolean;
  isSelected: boolean;
}

function ItemMainRow({
  item,
  hasMetadata,
  isInherited,
  isSelected,
}: Readonly<ItemMainRowProps>): React.JSX.Element {
  return (
    <div className="item-main">
      {hasMetadata && (
        <button
          type="button"
          className="item-info-btn"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          title="More info"
        >
          ?
        </button>
      )}
      <div className="item-title">
        <h3>{item.name}</h3>
        <span className="item-type">{item.type}</span>
        {isInherited && isSelected && <span className="inherited-badge">inherited</span>}
      </div>
      <div className="item-checkbox" />
    </div>
  );
}

interface Props {
  item: EnrichedItem;
  depth: number;
  index: number;
  isSelected: boolean;
  isInherited: boolean;
  toggleItem: (id: string) => void;
  addItems: (ids: string[]) => void;
  itemsById: Map<string, EnrichedItem>;
}

export default function ItemCard({
  item,
  depth,
  index,
  isSelected,
  isInherited,
  toggleItem,
  addItems,
  itemsById,
}: Readonly<Props>): React.JSX.Element {
  const parentName = getParentName(item, itemsById);
  const commonItems = (item.commonWith || [])
    .map((id) => itemsById.get(id))
    .filter((i): i is EnrichedItem => Boolean(i));
  const hasMetadata = hasItemMetadata(item, parentName, commonItems);

  return (
    <article
      className="item-card"
      data-selected={isSelected || undefined}
      data-inherited={(isInherited && isSelected) || undefined}
      data-depth={depth || undefined}
      data-delay={Math.min(index, 10) || undefined}
      onClick={() => toggleItem(item.id)}
    >
      <ItemMainRow
        item={item}
        hasMetadata={hasMetadata}
        isInherited={isInherited}
        isSelected={isSelected}
      />
      {hasMetadata && (
        <ItemMetaOverlay
          item={item}
          parentName={parentName}
          commonItems={commonItems}
          addItems={addItems}
        />
      )}
    </article>
  );
}
