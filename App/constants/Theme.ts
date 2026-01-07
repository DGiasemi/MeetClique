// Starter theme tokens for EventsApp

export const Theme = {
  // Brand
  primary: '#3B82F6', // used widely as interactive accent
  accent: '#eb3678',

  // Semantic colors
  success: '#10B981',
  danger: '#EF4444',
  warning: '#EAB308',
  info: '#6366F1',

  // Surfaces
  backgroundLight: '#FFFFFF',
  backgroundDark: '#151718',
  surface: '#0f0f0f',

  // Text
  textPrimaryLight: '#11181C',
  textPrimaryDark: '#ECEDEE',
  textSecondary: '#9CA3AF',
  muted: '#6B7280',

  // Borders / shadows
  border: '#3F3F3F',
  shadow: '#000000',

  // Special / branding
  logoBlue: '#4AA9FF',
  mapWater: '#00BFFF',
  mapLand: '#f5f5f5',

  // Gradients (example stops)
  gradientA: ['#5D4178', '#2D1248'],
  gradientB: ['#3b82f6', '#2563eb'],
};

export type ThemeType = typeof Theme;
