import ItemCard from "./ItemCard";

export default function CategorySection({
  section,
  selectedSet,
  inheritedSet,
  itemsById,
  toggleItem,
  addItems,
  toggleCategoryCollapse,
  collapsedCategories,
}) {
  const isCollapsed = collapsedCategories.has(section.id);

  return (
    <div
      className="category-section"
      data-collapsed={isCollapsed || undefined}
      data-category={section.id}
    >
      <button
        type="button"
        className="section-header"
        onClick={() => toggleCategoryCollapse(section.id)}
      >
        <span className="section-toggle">{isCollapsed ? "+" : "\u2212"}</span>
        <div className="section-title">
          <h2>{section.name}</h2>
          <p>{section.description}</p>
        </div>
        <span className="section-count">{section.items.length} visible</span>
      </button>
      {!isCollapsed && (
        <div className="item-list">
          {section.items.map(({ item, depth }, index) => (
            <ItemCard
              key={item.id}
              item={item}
              depth={depth}
              index={index}
              isSelected={selectedSet.has(item.id)}
              isInherited={inheritedSet.has(item.id)}
              toggleItem={toggleItem}
              addItems={addItems}
              itemsById={itemsById}
            />
          ))}
        </div>
      )}
    </div>
  );
}
