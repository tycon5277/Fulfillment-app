// Mobile Genie Theme - Sophisticated Dark with Balanced Accents
export const MOBILE_GENIE_THEME = {
  // Core colors - Deeper, richer dark
  background: '#0D0D12',
  backgroundSecondary: '#13131A',
  cardBg: '#1A1A24',
  cardBgHover: '#22222E',
  cardBorder: '#2A2A38',
  
  // Primary - Soft Cyan/Teal (less aggressive than neon green)
  primary: '#06B6D4',
  primaryLight: '#22D3EE',
  primaryDark: '#0891B2',
  primaryGlow: '#06B6D430',
  
  // Accent colors for gamification
  secondary: '#8B5CF6',    // Purple - XP/Level
  accent1: '#F472B6',      // Soft Pink - Streak/Hot
  accent2: '#FBBF24',      // Gold - Coins/Rewards
  accent3: '#60A5FA',      // Soft Blue - Info/Tasks
  accent4: '#34D399',      // Emerald - Success/Online
  accent5: '#F87171',      // Soft Red - Urgent/Error
  accent6: '#A78BFA',      // Lavender - Special
  
  // Text
  white: '#FFFFFF',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDim: '#475569',
  
  // Status
  success: '#34D399',
  error: '#F87171',
  warning: '#FBBF24',
  info: '#60A5FA',
  
  // Online status
  online: '#34D399',
  offline: '#64748B',
  busy: '#FBBF24',
  
  // Gradients
  gradientPrimary: ['#06B6D4', '#0891B2'],
  gradientOnline: ['#34D399', '#10B981'],
  gradientGold: ['#FBBF24', '#F59E0B'],
  gradientPurple: ['#8B5CF6', '#7C3AED'],
  gradientPink: ['#F472B6', '#EC4899'],
  gradientButton: ['#6366F1', '#8B5CF6'],  // Indigo to Purple for buttons
};

// Skilled Genie Theme - Professional Teal
export const SKILLED_GENIE_THEME = {
  background: '#F0FDFA',
  backgroundSecondary: '#CCFBF1',
  cardBg: '#FFFFFF',
  cardBorder: '#99F6E4',
  
  primary: '#0D9488',
  primaryLight: '#14B8A6',
  primaryDark: '#0F766E',
  
  text: '#134E4A',
  textSecondary: '#5EEAD4',
  textMuted: '#5EEAD4',
  
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
};

// Get theme based on agent type
export const getTheme = (agentType: string | null | undefined) => {
  if (agentType === 'skilled') {
    return SKILLED_GENIE_THEME;
  }
  return MOBILE_GENIE_THEME;
};

export default MOBILE_GENIE_THEME;
