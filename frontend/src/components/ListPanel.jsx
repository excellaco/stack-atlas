import { useStore } from "../store";
import CategorySection from "./CategorySection";

export default function ListPanel({ sections, selectedSet, inheritedSet, itemsById }) {
  const toggleItem = useStore((s) => s.toggleItem);
  const addItems = useStore((s) => s.addItems);
  const collapsedCategories = useStore((s) => s.collapsedCategories);
  const toggleCategoryCollapse = useStore((s) => s.toggleCategoryCollapse);

  return (
    <section className="list-panel">
      {sections.map((s) => (
        <CategorySection
          key={s.id}
          section={s}
          selectedSet={selectedSet}
          inheritedSet={inheritedSet}
          itemsById={itemsById}
          toggleItem={toggleItem}
          addItems={addItems}
          toggleCategoryCollapse={toggleCategoryCollapse}
          collapsedCategories={collapsedCategories}
        />
      ))}
    </section>
  );
}
