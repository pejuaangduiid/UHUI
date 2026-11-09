import { create } from "zustand";

export interface ScanItemProposal {
  description: string;
  qty: number;
  unitPriceIDR: number;
  lineTotalIDR: number;
  matchedInventoryItemId?: string;
}

export interface StoredScan {
  scanId: string;
  merchantName: string;
  date: string;
  totalAmountIDR: number;
  items: ScanItemProposal[];
  duplicateSuspect: boolean;
  imageDataUrl?: string;
}

interface ScanStoreState {
  currentScan: StoredScan | null;
  setCurrentScan: (scan: StoredScan | null) => void;
  updateItemMapping: (index: number, inventoryItemId: string) => void;
  clearScan: () => void;
}

export const useScanStore = create<ScanStoreState>((set) => ({
  currentScan: null,
  setCurrentScan: (scan) => set({ currentScan: scan }),
  updateItemMapping: (index, inventoryItemId) => {
    set((state) => {
      if (!state.currentScan) return state;
      const updated = [...state.currentScan.items];
      const target = updated[index];
      if (target) {
        updated[index] = { ...target, matchedInventoryItemId: inventoryItemId };
      }
      return {
        currentScan: { ...state.currentScan, items: updated },
      };
    });
  },
  clearScan: () => set({ currentScan: null }),
}));

