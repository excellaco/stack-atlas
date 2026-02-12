import { getParentName } from "../utils/diff";

function ItemTags({ tags }) {
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

function CommonItems({ items, addItems }) {
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
            onClick={(e) => {
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

function ItemMetaOverlay({ item, parentName, commonItems, addItems }) {
  return (
    <div className="item-meta-overlay" onClick={(event) => event.stopPropagation()}>
      {item.description && <div className="item-description">{item.description}</div>}
      {parentName && <div className="item-parent">Parent: {parentName}</div>}
      {item.synonyms?.length > 0 && (
        <div className="item-synonyms">Also known as: {item.synonyms.join(", ")}</div>
      )}
      <ItemTags tags={item.tags} />
      <CommonItems items={commonItems} addItems={addItems} />
    </div>
  );
}

function hasItemMetadata(item, parentName, commonItems) {
  return !!(
    item.description ||
    parentName ||
    item.synonyms?.length ||
    item.tags?.length ||
    commonItems.length
  );
}

function ItemMainRow({ item, hasMetadata, isInherited, isSelected }) {
  return (
    <div className="item-main">
      {hasMetadata && (
        <button
          type="button"
          className="item-info-btn"
          onClick={(e) => e.stopPropagation()}
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

export default function ItemCard({
  item,
  depth,
  index,
  isSelected,
  isInherited,
  toggleItem,
  addItems,
  itemsById,
}) {
  const parentName = getParentName(item, itemsById);
  const commonItems = (item.commonWith || []).map((id) => itemsById.get(id)).filter(Boolean);
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
