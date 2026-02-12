import AdminCatalogCategories from "./AdminCatalogCategories";
import AdminCatalogItems from "./AdminCatalogItems";
import type { AdminCatalogReturn } from "./useAdminCatalog";

interface CatalogActionsProps {
  catalogDirty: boolean;
  catalogSource: "static" | "api";
  saving: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onPublish: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSeedFromStatic: () => void;
}

function CatalogActions({
  catalogDirty,
  catalogSource,
  saving,
  fileInputRef,
  onPublish,
  onUpload,
  onSeedFromStatic,
}: Readonly<CatalogActionsProps>): React.JSX.Element {
  return (
    <section className="admin-section">
      <div className="catalog-actions">
        <button
          type="button"
          className="publish-catalog-btn"
          data-dirty={catalogDirty || undefined}
          onClick={onPublish}
          disabled={!catalogDirty || saving}
        >
          {saving ? "Publishing..." : "Publish to S3"}
        </button>
        <button type="button" className="ghost" onClick={() => fileInputRef.current?.click()}>
          Upload JSON
        </button>
        <button type="button" className="ghost" onClick={onSeedFromStatic}>
          Seed from Static
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden-input"
          onChange={onUpload}
        />
        <span className="catalog-source-badge">
          {catalogSource === "api" ? "S3" : "Static"}
          {catalogDirty ? " *" : ""}
        </span>
      </div>
    </section>
  );
}

interface Props {
  catalog: AdminCatalogReturn;
  saving: boolean;
  onPublish: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSeedFromStatic: () => void;
}

export default function AdminCatalogTab({
  catalog,
  saving,
  onPublish,
  onUpload,
  onSeedFromStatic,
}: Readonly<Props>): React.JSX.Element {
  return (
    <>
      <CatalogActions
        catalogDirty={catalog.catalogDirty}
        catalogSource={catalog.catalogSource}
        saving={saving}
        fileInputRef={catalog.fileInputRef}
        onPublish={onPublish}
        onUpload={onUpload}
        onSeedFromStatic={onSeedFromStatic}
      />
      <AdminCatalogCategories
        categories={catalog.editCategories}
        items={catalog.editItems}
        editingCategory={catalog.editingCategory}
        setEditingCategory={catalog.setEditingCategory}
        onSave={catalog.handleSaveCatalogCategory}
        onDelete={(catId) => {
          void catalog.handleDeleteCatalogCategory(catId);
        }}
      />
      <AdminCatalogItems
        categories={catalog.editCategories}
        types={catalog.editTypes}
        filteredItems={catalog.filteredEditItems}
        allItemsCount={catalog.editItems.length}
        editingItem={catalog.editingItem}
        setEditingItem={catalog.setEditingItem}
        editDescriptions={catalog.editDescriptions}
        itemSearch={catalog.itemSearch}
        setItemSearch={catalog.setItemSearch}
        itemCategoryFilter={catalog.itemCategoryFilter}
        setItemCategoryFilter={catalog.setItemCategoryFilter}
        onSave={catalog.handleSaveCatalogItem}
        onDelete={(itemId) => {
          void catalog.handleDeleteCatalogItem(itemId);
        }}
      />
    </>
  );
}
