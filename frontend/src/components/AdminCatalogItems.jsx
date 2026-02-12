import CatalogItemForm from "./CatalogItemForm";

function ItemRow({ item, categoryName, onEdit, onDelete }) {
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

function ItemSearchBar({
  categories,
  itemSearch,
  setItemSearch,
  itemCategoryFilter,
  setItemCategoryFilter,
}) {
  return (
    <div className="catalog-search">
      <input
        placeholder="Search items..."
        value={itemSearch}
        onChange={(e) => setItemSearch(e.target.value)}
      />
      <select value={itemCategoryFilter} onChange={(e) => setItemCategoryFilter(e.target.value)}>
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

function ItemEditor({ editingItem, editDescriptions, categories, types, onSave, setEditingItem }) {
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

function ItemTable({ filteredItems, categories, setEditingItem, onDelete }) {
  const getCategoryName = (catId) => categories.find((c) => c.id === catId)?.name || catId;
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

export default function AdminCatalogItems(props) {
  const { categories, types, filteredItems, allItemsCount, editingItem, setEditingItem } = props;
  const newItem = { id: "", name: "", category: categories[0]?.id || "", type: types[0] || "" };

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
