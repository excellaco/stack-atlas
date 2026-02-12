function CategoryForm({ category, onChange, onSave, onCancel }) {
  const update = (field, value) => onChange({ ...category, [field]: value });
  return (
    <div className="catalog-form">
      <input
        placeholder="ID (e.g. ai-ml)"
        value={category.id || ""}
        onChange={(e) => update("id", e.target.value)}
      />
      <input
        placeholder="Name"
        value={category.name || ""}
        onChange={(e) => update("name", e.target.value)}
      />
      <input
        placeholder="Description"
        value={category.description || ""}
        onChange={(e) => update("description", e.target.value)}
      />
      <input
        type="color"
        value={category.color || "#6b7280"}
        onChange={(e) => update("color", e.target.value)}
      />
      <div className="catalog-form-actions">
        <button
          type="button"
          className="primary"
          onClick={() => onSave(category)}
          disabled={!category.id?.trim() || !category.name?.trim()}
        >
          Save
        </button>
        <button type="button" className="ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function CategoryRow({ cat, itemCount, onEdit, onDelete }) {
  return (
    <div className="admin-table-row">
      <div className="admin-table-main">
        <span className="catalog-color-dot" data-category={cat.id} />
        <strong>{cat.name}</strong>
        {cat.description && <span className="admin-table-desc">{cat.description}</span>}
      </div>
      <span className="admin-table-meta">{itemCount} items</span>
      <button type="button" className="ghost" onClick={() => onEdit({ ...cat })}>
        Edit
      </button>
      <button type="button" className="ghost danger" onClick={() => onDelete(cat.id)}>
        Delete
      </button>
    </div>
  );
}

export default function AdminCatalogCategories({
  categories,
  items,
  editingCategory,
  setEditingCategory,
  onSave,
  onDelete,
}) {
  const newCategory = { id: "", name: "", description: "", color: "#6b7280" };

  return (
    <section className="admin-section">
      <h4>Categories ({categories.length})</h4>
      {editingCategory !== null && (
        <CategoryForm
          category={editingCategory}
          onChange={setEditingCategory}
          onSave={onSave}
          onCancel={() => setEditingCategory(null)}
        />
      )}
      <div className="admin-table">
        {categories.map((cat) => (
          <CategoryRow
            key={cat.id}
            cat={cat}
            itemCount={items.filter((i) => i.category === cat.id).length}
            onEdit={setEditingCategory}
            onDelete={onDelete}
          />
        ))}
      </div>
      <button type="button" className="ghost" onClick={() => setEditingCategory(newCategory)}>
        + Add Category
      </button>
    </section>
  );
}
