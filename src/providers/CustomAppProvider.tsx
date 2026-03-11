'use client'

import { createCustomAppStore, CustomAppStore, initCustomAppStore } from '@/stores/app-store'
import { type ReactNode, createContext, useRef, useContext } from 'react'
import { useStore } from 'zustand'


export type CustomAppStoreApi = ReturnType<typeof createCustomAppStore>

export const CustomAppStoreContext = createContext<CustomAppStoreApi | undefined>(
  undefined,
)

export interface CustomAppProviderProps {
  children: ReactNode,
}

export const CustomAppProvider = ({
  children,
}: CustomAppProviderProps) => {
  const storeRef = useRef<CustomAppStoreApi | null>(null)
  if (storeRef.current === null) {
    storeRef.current = createCustomAppStore(initCustomAppStore());
  }

  return (
    <CustomAppStoreContext.Provider value={storeRef.current}>
      {children}
    </CustomAppStoreContext.Provider>
  )
}

export const useCustomAppStore = <T,>(
  selector: (store: CustomAppStore) => T,
): T => {
  const customAppStoreContext = useContext(CustomAppStoreContext)

  if (!customAppStoreContext) {
    throw new Error(`useCustomAppStore must be used within CustomAppProvider`)
  }

  return useStore(customAppStoreContext, selector)
}