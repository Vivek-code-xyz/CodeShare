/**
 * client/src/store/useStore.js
 * Zustand store for EphemeralDrop state management.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      // Settings
      theme: 'dark',
      font: 'Geist',
      setTheme: (theme) => set({ theme }),
      setFont: (font) => set({ font }),

      // Upload State
      uploadFiles: [],
      addFiles: (files) => set((state) => ({ 
        uploadFiles: [...state.uploadFiles, ...files].slice(0, 5) 
      })),
      removeFile: (index) => set((state) => ({ 
        uploadFiles: state.uploadFiles.filter((_, i) => i !== index) 
      })),
      clearUploadFiles: () => set({ uploadFiles: [] }),

      // Session Result State
      uploadSession: null,
      messageSession: null,
      setUploadSession: (session) => set({ uploadSession: session }),
      setMessageSession: (session) => set({ messageSession: session }),
      clearSessions: () => set({ uploadSession: null, messageSession: null }),
    }),
    {
      name: 'ephemeral-drop-storage',
      partialize: (state) => ({ theme: state.theme, font: state.font }),
    }
  )
);

export default useStore;
