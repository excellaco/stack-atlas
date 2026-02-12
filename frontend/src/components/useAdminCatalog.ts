import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../store";
import * as actions from "./catalogActions";
import type { CatalogSetters } from "./catalogActions";
import type { Category, Catalog, RawItem } from "../types";

function useFilteredItems(
  editItems: RawItem[],
  itemCategoryFilter: string,
  itemSearch: string
): RawItem[] {
  return useMemo(() => {
    let result = editItems;
    if (itemCategoryFilter) {
      result = result.filter((i) => i.category === itemCategoryFilter);
    }
    if (itemSearch.trim()) {
      const q = itemSearch.trim().toLowerCase();
      result = result.filter(
        (i) => i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [editItems, itemCategoryFilter, itemSearch]);
}

interface SyncStoreState {
  catalogCategories: Category[];
  catalogRawItems: RawItem[];
  catalogTypes: string[];
  catalogDescriptions: Record<string, string>;
}

function useSyncFromStore(storeState: SyncStoreState, setters: CatalogSetters): void {
  const { catalogCategories, catalogRawItems, catalogTypes, catalogDescriptions } = storeState;
  useEffect(() => {
    setters.setEditCategories(catalogCategories);
    setters.setEditItems(catalogRawItems);
    setters.setEditTypes(catalogTypes);
    setters.setEditDescriptions(catalogDescriptions);
    setters.setCatalogDirty(false);
  }, [catalogCategories, catalogRawItems, catalogTypes, catalogDescriptions, setters]);
}

interface EditState {
  editCategories: Category[];
  editTypes: string[];
  editDescriptions: Record<string, string>;
  editItems: RawItem[];
  editingItem: RawItem | null;
}

interface CatalogHandlers {
  handlePublishCatalog: (
    setSaving: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string>>
  ) => Promise<void>;
  handleUploadCatalog: (
    e: React.ChangeEvent<HTMLInputElement>,
    setError: React.Dispatch<React.SetStateAction<string>>
  ) => void;
  handleSeedFromStatic: () => void;
  handleSaveCatalogItem: (itemData: RawItem, desc: string) => void;
  handleDeleteCatalogItem: (itemId: string) => Promise<void>;
  handleSaveCatalogCategory: (catData: Category) => void;
  handleDeleteCatalogCategory: (catId: string) => Promise<void>;
}

function buildHandlers(
  token: string | null,
  setCatalogFromPublish: (catalog: Catalog) => void,
  editState: EditState,
  setters: CatalogSetters
): CatalogHandlers {
  const { editCategories, editTypes, editDescriptions, editItems, editingItem } = editState;
  return {
    handlePublishCatalog: (
      setSaving: React.Dispatch<React.SetStateAction<boolean>>,
      setError: React.Dispatch<React.SetStateAction<string>>
    ) => {
      const handler = actions.createPublishHandler({
        editCategories,
        editTypes,
        editDescriptions,
        editItems,
        setCatalogDirty: setters.setCatalogDirty,
      });
      return handler(token, setCatalogFromPublish, setSaving, setError);
    },
    handleUploadCatalog: (
      e: React.ChangeEvent<HTMLInputElement>,
      setError: React.Dispatch<React.SetStateAction<string>>
    ) => actions.handleUploadCatalog(e, setters, setError),
    handleSeedFromStatic: () => actions.handleSeedFromStatic(setters),
    handleSaveCatalogItem: (itemData: RawItem, desc: string) =>
      actions.saveCatalogItem(itemData, desc, editingItem, setters),
    handleDeleteCatalogItem: (itemId: string) => actions.deleteCatalogItem(itemId, setters),
    handleSaveCatalogCategory: (catData: Category) => actions.saveCatalogCategory(catData, setters),
    handleDeleteCatalogCategory: (catId: string) =>
      actions.deleteCatalogCategory(catId, editItems, setters),
  };
}

interface CatalogEditState {
  editCategories: Category[];
  editItems: RawItem[];
  editTypes: string[];
  editDescriptions: Record<string, string>;
  catalogDirty: boolean;
  editingItem: RawItem | null;
  setEditingItem: React.Dispatch<React.SetStateAction<RawItem | null>>;
  editingCategory: Category | null;
  setEditingCategory: React.Dispatch<React.SetStateAction<Category | null>>;
  itemSearch: string;
  setItemSearch: React.Dispatch<React.SetStateAction<string>>;
  itemCategoryFilter: string;
  setItemCategoryFilter: React.Dispatch<React.SetStateAction<string>>;
  setters: CatalogSetters;
}

function useCatalogEditState(
  catalogCategories: Category[],
  catalogRawItems: RawItem[],
  catalogTypes: string[],
  catalogDescriptions: Record<string, string>
): CatalogEditState {
  const [editCategories, setEditCategories] = useState<Category[]>(catalogCategories);
  const [editItems, setEditItems] = useState<RawItem[]>(catalogRawItems);
  const [editTypes, setEditTypes] = useState<string[]>(catalogTypes);
  const [editDescriptions, setEditDescriptions] =
    useState<Record<string, string>>(catalogDescriptions);
  const [catalogDirty, setCatalogDirty] = useState(false);
  const [editingItem, setEditingItem] = useState<RawItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [itemCategoryFilter, setItemCategoryFilter] = useState("");
  const setters: CatalogSetters = {
    setEditCategories,
    setEditItems,
    setEditTypes,
    setEditDescriptions,
    setCatalogDirty,
    setEditingItem,
    setEditingCategory,
  };
  return {
    editCategories,
    editItems,
    editTypes,
    editDescriptions,
    catalogDirty,
    editingItem,
    setEditingItem,
    editingCategory,
    setEditingCategory,
    itemSearch,
    setItemSearch,
    itemCategoryFilter,
    setItemCategoryFilter,
    setters,
  };
}

export type AdminCatalogReturn = CatalogEditState &
  CatalogHandlers & {
    catalogSource: "static" | "api";
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    filteredEditItems: RawItem[];
  };

export default function useAdminCatalog(): AdminCatalogReturn {
  const token = useStore((s) => s.token);
  const catalogCategories = useStore((s) => s.catalogCategories);
  const catalogTypes = useStore((s) => s.catalogTypes);
  const catalogRawItems = useStore((s) => s.catalogRawItems);
  const catalogDescriptions = useStore((s) => s.catalogDescriptions);
  const catalogSource = useStore((s) => s.catalogSource);
  const setCatalogFromPublish = useStore((s) => s.setCatalogFromPublish);

  const es = useCatalogEditState(
    catalogCategories,
    catalogRawItems,
    catalogTypes,
    catalogDescriptions
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const storeState: SyncStoreState = {
    catalogCategories,
    catalogRawItems,
    catalogTypes,
    catalogDescriptions,
  };
  useSyncFromStore(storeState, es.setters);

  const filteredEditItems = useFilteredItems(es.editItems, es.itemCategoryFilter, es.itemSearch);
  const editState: EditState = {
    editCategories: es.editCategories,
    editTypes: es.editTypes,
    editDescriptions: es.editDescriptions,
    editItems: es.editItems,
    editingItem: es.editingItem,
  };
  const handlers = buildHandlers(token, setCatalogFromPublish, editState, es.setters);

  return { ...es, catalogSource, fileInputRef, filteredEditItems, ...handlers };
}
