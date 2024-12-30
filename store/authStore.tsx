import { create } from "zustand";

interface AuthState {
  userId: string | null;
  agencyId: string | null;
  setAuthData: (userId: string | null, agencyId: string | null) => void;
}

const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  agencyId: null,
  setAuthData: (userId, agencyId) =>
    set(() => ({ userId, agencyId })),
}));

export default useAuthStore;
