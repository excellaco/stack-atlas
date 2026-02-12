import CatalogItemForm from "./CatalogItemForm";
import type { Category, RawItem } from "../types";

interface ItemRowProps {
  item: RawItem;
  categoryName: string;
  onEdit: (item: RawItem) => void;
  onDelete: (itemId: string) => void;
}

function ItemRow({
  item,
  categoryName,
  onEdit,
  onDelete,
}: Readonly<ItemRowProps>): React.JSX.Element {
  return (
    <div className="admin-table-row">
      <div className="admin-table-main">
        <strong>{item.name}</strong>
        <span className="admin-table-desc">
          {item.type} · {categoryName}
        </span>
      </div>
      <span className="admin-table-meta">{item.id}</span>
      <button type="button" className="ghost" onClick={() => onEdit({ ...item })}>
        Edit
      </button>
      <button type="button" className="ghost danger" onClick={() => onDelete(item.id)}>
        Delete
      </button>
    </div>
  );
}

interface ItemSearchBarProps {
  categories: Category[];
  itemSearch: string;
  setItemSearch: React.Dispatch<React.SetStateAction<string>>;
  itemCategoryFilter: string;
  setItemCategoryFilter: React.Dispatch<React.SetStateAction<string>>;
}

function ItemSearchBar({
  categories,
  itemSearch,
  setItemSearch,
  itemCategoryFilter,
  setItemCategoryFilter,
}: Readonly<ItemSearchBarProps>): React.JSX.Element {
  return (
    <div className="catalog-search">
      <input
        placeholder="Search items..."
        value={itemSearch}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemSearch(e.target.value)}
      />
      <select
        value={itemCategoryFilter}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          setItemCategoryFilter(e.target.value)
        }
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ItemEditorProps {
  editingItem: RawItem | null;
  editDescriptions: Record<string, string>;
  categories: Category[];
  types: string[];
  onSave: (itemData: RawItem, description: string) => void;
  setEditingItem: React.Dispatch<React.SetStateAction<RawItem | null>>;
}

function ItemEditor({
  editingItem,
  editDescriptions,
  categories,
  types,
  onSave,
  setEditingItem,
}: Readonly<ItemEditorProps>): React.JSX.Element | null {
  if (editingItem === null) return null;
  return (
    <CatalogItemForm
      item={editingItem.id ? editingItem : null}
      description={editingItem.id ? editDescriptions[editingItem.id] || "" : ""}
      categories={categories}
      types={types}
      onSave={onSave}
      onCancel={() => setEditingItem(null)}
    />
  );
}

interface ItemTableProps {
  filteredItems: RawItem[];
  categories: Category[];
  setEditingItem: React.Dispatch<React.SetStateAction<RawItem | null>>;
  onDelete: (itemId: string) => void;
}

function ItemTable({
  filteredItems,
  categories,
  setEditingItem,
  onDelete,
}: Readonly<ItemTableProps>): React.JSX.Element {
  const getCategoryName = (catId: string): string =>
    categories.find((c) => c.id === catId)?.name || catId;
  return (
    <div className="admin-table">
      {filteredItems.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          categoryName={getCategoryName(item.category)}
          onEdit={setEditingItem}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

interface Props {
  categories: Category[];
  types: string[];
  filteredItems: RawItem[];
  allItemsCount: number;
  editingItem: RawItem | null;
  setEditingItem: React.Dispatch<React.SetStateAction<RawItem | null>>;
  editDescriptions: Record<string, string>;
  itemSearch: string;
  setItemSearch: React.Dispatch<React.SetStateAction<string>>;
  itemCategoryFilter: string;
  setItemCategoryFilter: React.Dispatch<React.SetStateAction<string>>;
  onSave: (itemData: RawItem, description: string) => void;
  onDelete: (itemId: string) => void;
}

export default function AdminCatalogItems(props: Readonly<Props>): React.JSX.Element {
  const { categories, types, filteredItems, allItemsCount, editingItem, setEditingItem } = props;
  const newItem: RawItem = {
    id: "",
    name: "",
    category: categories[0]?.id || "",
    type: types[0] || "",
  };

  return (
    <section className="admin-section">
      <h4>Items ({allItemsCount})</h4>
      <ItemSearchBar
        categories={categories}
        itemSearch={props.itemSearch}
        setItemSearch={props.setItemSearch}
        itemCategoryFilter={props.itemCategoryFilter}
        setItemCategoryFilter={props.setItemCategoryFilter}
      />
      <ItemEditor
        editingItem={editingItem}
        editDescriptions={props.editDescriptions}
        categories={categories}
        types={types}
        onSave={props.onSave}
        setEditingItem={setEditingItem}
      />
      <ItemTable
        filteredItems={filteredItems}
        categories={categories}
        setEditingItem={setEditingItem}
        onDelete={props.onDelete}
      />
      <button type="button" className="ghost" onClick={() => setEditingItem(newItem)}>
        + Add Item
      </button>
    </section>
  );
}
