import { createStore } from 'zustand/vanilla'

export type CustomAppState = {
  permissions: string[];
  isFetchingPermissions:boolean;
}

export type CustomAppActions = {
  addPermission: (permissions: string[]) => void
  removePermission: () => void
  setIsFetchingPermission: (status:boolean) => void
}

export type CustomAppStore = CustomAppState & CustomAppActions

export const initCustomAppStore = (): CustomAppState => {
  return { permissions: [],isFetchingPermissions:true }
}

export const defaultInitState: CustomAppState = {
  permissions:[],
  isFetchingPermissions:true
}

export const createCustomAppStore = (
  initState: CustomAppState = defaultInitState,
) => {
  return createStore<CustomAppStore>()((set) => ({
    ...initState,
    addPermission: (permissions) => set((state) => ({ permissions: permissions })),
    removePermission: () => set((state) => ({ permissions: [] })),
    setIsFetchingPermission: (status) => set(()=> ({isFetchingPermissions:status}))
  }))
}