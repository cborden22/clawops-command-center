import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const APP_SETTINGS_KEY = "clawops-app-settings";

export interface AppSettings {
  businessName: string;
  warehouseAddress: string;
  warehouseCity: string;
  warehouseState: string;
  warehouseZip: string;
  businessPhone: string;
  businessEmail: string;
  currency: string;
  timezone: string;
  defaultCommissionRate: number;
  lowStockThreshold: number;
  dateFormat: string;
  darkMode: boolean;
  compactView: boolean;
  autoBackup: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  businessName: "",
  warehouseAddress: "",
  warehouseCity: "",
  warehouseState: "",
  warehouseZip: "",
  businessPhone: "",
  businessEmail: "",
  currency: "USD",
  timezone: "America/New_York",
  defaultCommissionRate: 25,
  lowStockThreshold: 5,
  dateFormat: "MM/dd/yyyy",
  darkMode: true,
  compactView: false,
  autoBackup: true,
};

interface AppSettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  saveSettings: () => void;
  isLoaded: boolean;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(APP_SETTINGS_KEY);
    if (saved) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to load app settings:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Apply dark mode and compact view to document
  useEffect(() => {
    if (!isLoaded) return;
    
    // Apply dark mode
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Apply compact view
    if (settings.compactView) {
      document.documentElement.classList.add("compact");
    } else {
      document.documentElement.classList.remove("compact");
    }
  }, [settings.darkMode, settings.compactView, isLoaded]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      // Auto-save on change
      localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const saveSettings = () => {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
  };

  return (
    <AppSettingsContext.Provider value={{ settings, updateSetting, saveSettings, isLoaded }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error("useAppSettings must be used within an AppSettingsProvider");
  }
  return context;
}
