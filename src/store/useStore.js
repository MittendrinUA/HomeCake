import { create } from 'zustand';

const useStore = create((set) => ({
  // Auth
  user: null,
  isAuthenticated: false,

  // Settings
  settings: {
    language: 'uk',
    currency: 'грн',
    notifications: {
      orderDeadlineDays: 1, // Сповіщати за X днів до дедлайну
      expiryAlertDays: 3,   // Сповіщати за X днів до закінчення терміну придатності
    }
  },
  setSettings: (settings) => set({ settings }),

  // Data
  inventory: [],
  recipes: [],
  sales: [],
  customers: [],
  preps: [],
  categories: [],
  waste: [],
  inventoryLogs: [],

  // Loaders
  isLoading: true,
  loadingStep: null,

  // Actions
  setInventory:    (inventory)    => set({ inventory }),
  setRecipes:      (recipes)      => set({ recipes }),
  setSales:        (sales)        => set({ sales }),
  setCustomers:    (customers)    => set({ customers }),
  setPreps:        (preps)        => set({ preps }),
  setCategories:   (categories)   => set({ categories }),
  setWaste:        (waste)        => set({ waste }),
  setInventoryLogs:(inventoryLogs)=> set({ inventoryLogs }),
  setUser:         (user)         => set({ user, isAuthenticated: !!user }),
  setIsLoading:    (isLoading)    => set({ isLoading }),
  setLoadingStep:  (loadingStep)  => set({ loadingStep }),

  // Clears ALL user-specific data — call before switching accounts
  resetAllData: () => set({
    inventory: [], recipes: [], sales: [], customers: [],
    preps: [], categories: [], waste: [], inventoryLogs: [],
  }),
}));

export default useStore;
