import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatExport } from "../utils/export";
import { useStore } from "../store";
import { selectDirty } from "../store/selectors";
import {
  useUrlSync,
  useCatalogData,
  useSelectionState,
  useFilteredSections,
  useHasActualChanges,
} from "../hooks/useEditorState";
import AdminPanel from "./AdminPanel";
import AppFooter from "./AppFooter";
import CategoryStyles from "./CategoryStyles";
import ConfirmModal from "./ConfirmModal";
import EditorTopBar from "./EditorTopBar";
import FilterPanel from "./FilterPanel";
import ListPanel from "./ListPanel";
import SelectedPanel from "./SelectedPanel";
import SessionExpiredOverlay from "./SessionExpiredOverlay";
import "../App.css";

function useTokenRefresh() {
  const token = useStore((s) => s.token);
  const startTokenRefresh = useStore((s) => s.startTokenRefresh);
  useEffect(() => {
    if (!token) return;
    return startTokenRefresh();
  }, [token, startTokenRefresh]);
}

function useSwitchToView() {
  const navigate = useNavigate();
  const activeProject = useStore((s) => s.activeProject);
  const activeSubsystem = useStore((s) => s.activeSubsystem);
  return useCallback(async () => {
    if (selectDirty(useStore.getState())) {
      const ok = await useStore.getState().requestConfirm({
        title: "Leave Editor",
        message: "You have unsaved changes that haven't been auto-saved yet. Continue?",
        confirmLabel: "Leave Editor",
        variant: "warning",
      });
      if (!ok) return;
    }
    const subPath = activeSubsystem ? `/${activeSubsystem.id}` : "";
    navigate(`/view/${activeProject.id}${subPath}`);
  }, [navigate, activeProject, activeSubsystem]);
}

export default function Editor({ sandbox }) {
  const token = useStore((s) => s.token);
  const density = useStore((s) => s.density);
  const catalogCategories = useStore((s) => s.catalogCategories);
  const showAdmin = useStore((s) => s.showAdmin);

  useUrlSync(sandbox);
  useTokenRefresh();
  const handleSwitchToView = useSwitchToView();

  const { catalogItems, itemsById, categoryById } = useCatalogData();
  const { selectedSet, inheritedSet, selectedByCategory, exportData } =
    useSelectionState(itemsById);
  const sections = useFilteredSections(catalogItems, itemsById, categoryById);
  const hasActualChanges = useHasActualChanges();

  const handleCopyAs = async (format) => {
    try {
      await navigator.clipboard.writeText(formatExport(exportData, format));
    } catch (error) {
      console.error("Failed to copy output", error);
    }
  };

  return (
    <div className="app" data-density={density}>
      <CategoryStyles categories={catalogCategories} />
      <EditorTopBar sandbox={sandbox} onSwitchToView={handleSwitchToView} />
      <main className="main-grid">
        <FilterPanel />
        <ListPanel
          sections={sections}
          selectedSet={selectedSet}
          inheritedSet={inheritedSet}
          itemsById={itemsById}
        />
        <SelectedPanel
          sandbox={sandbox}
          selectedByCategory={selectedByCategory}
          inheritedSet={inheritedSet}
          handleCopyAs={handleCopyAs}
          hasActualChanges={hasActualChanges}
        />
      </main>
      {showAdmin && token && <AdminPanel />}
      <SessionExpiredOverlay />
      <ConfirmModal />
      <AppFooter />
    </div>
  );
}
