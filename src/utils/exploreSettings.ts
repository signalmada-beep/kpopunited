// ========== src/utils/exploreSettings.ts ==========

const STORAGE_KEY = 'kpop_explore_settings';

// Mametraka ny type mivantana ao anatiny
interface ExploreSettings {
  showDataWarning: boolean;
  useWiFiOnly: boolean;
  autoRefreshNews: boolean;
  maxNewsPerCategory: number;
  useGoogleFallback: boolean;
}

// Default settings
const defaultSettings: ExploreSettings = {
  showDataWarning: true,
  useWiFiOnly: false,
  autoRefreshNews: true,
  maxNewsPerCategory: 10,
  useGoogleFallback: true,
};

export const getExploreSettings = (): ExploreSettings => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return { ...defaultSettings, ...JSON.parse(stored) };
    } catch {
      return defaultSettings;
    }
  }
  return defaultSettings;
};

export const saveExploreSettings = (settings: Partial<ExploreSettings>): void => {
  const current = getExploreSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const resetExploreSettings = (): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
};

export const shouldShowDataWarning = (): boolean => {
  const settings = getExploreSettings();
  return settings.showDataWarning;
};