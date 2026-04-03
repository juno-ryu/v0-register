import { create } from 'zustand'

interface StoreSelectionState {
  selectedStoreId: string | null
  selectedStoreName: string | null
  selectedBrandId: string | null
  selectedBrandName: string | null
  isStoreSelectionOpen: boolean
}

interface StoreSelectionActions {
  setSelectedStore: (storeId: string, storeName: string, brandId: string, brandName: string) => void
  clearSelectedStore: () => void
  setStoreSelectionOpen: (open: boolean) => void
}

const initialState: StoreSelectionState = {
  selectedStoreId: null,
  selectedStoreName: null,
  selectedBrandId: null,
  selectedBrandName: null,
  isStoreSelectionOpen: false,
}

export const useStoreSelectionStore = create<StoreSelectionState & StoreSelectionActions>((set) => ({
  ...initialState,

  setSelectedStore: (storeId, storeName, brandId, brandName) =>
    set({ selectedStoreId: storeId, selectedStoreName: storeName, selectedBrandId: brandId, selectedBrandName: brandName }),

  clearSelectedStore: () => set(initialState),

  setStoreSelectionOpen: (open) => set({ isStoreSelectionOpen: open }),
}))
