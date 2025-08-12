import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

export type GalaxyCardVariant = 'orbit' | 'tile' | 'minimal';
export type FitMode = 'wrap2' | 'shrink1';

type PrefsState = {
  galaxyCardVariant: GalaxyCardVariant;
  fitMode: FitMode;
  setVariant: (v: GalaxyCardVariant) => void;
  setFitMode: (m: FitMode) => void;
};

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      galaxyCardVariant: 'orbit',
      fitMode: 'wrap2',
      setVariant: (v) => set({ galaxyCardVariant: v }),
      setFitMode: (m) => set({ fitMode: m }),
    }),
    {
      name: 'prefs',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
);