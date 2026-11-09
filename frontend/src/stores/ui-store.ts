import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  isSidebarCollapsed: boolean;
  activeMobileTab: string;
  selectedSmeId: string | null;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveMobileTab: (tab: string) => void;
  setSelectedSmeId: (id: string | null) => void;
  resetUi: () => void;
}

      export const useUiStore = create<UiState>()(
        persist(
          (set) => ({
            isSidebarCollapsed: false,
            activeMobileTab: "summary",
            selectedSmeId: null,
            toggleSidebar: () =>
              set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
            setSidebarCollapsed: (collapsed: boolean) =>
              set({ isSidebarCollapsed: collapsed }),
            setActiveMobileTab: (tab: string) => set({ activeMobileTab: tab }),
            setSelectedSmeId: (id: string | null) => set({ selectedSmeId: id }),
            resetUi: () =>
              set({
                isSidebarCollapsed: false,
                activeMobileTab: "summary",
                selectedSmeId: null,
              }),
          }),
{
  name: "uhui_ui_store",
    partialize: (state) => ({ selectedSmeId: state.selectedSmeId }),
    }
  )
);
