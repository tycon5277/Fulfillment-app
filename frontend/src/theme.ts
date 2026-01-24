// Mobile Genie Theme - Dark with Neon Green (Gamified)
export const MOBILE_GENIE_THEME = {
  // Core colors
  background: '#0A0A0A',
  backgroundSecondary: '#111111',
  cardBg: '#1A1A1A',
  cardBgHover: '#222222',
  cardBorder: '#2A2A2A',
  
  // Primary - Neon Green
  primary: '#10B981',
  primaryLight: '#34D399',
  primaryDark: '#059669',
  primaryGlow: '#10B98150',
  
  // Accent colors for gamification
  secondary: '#8B5CF6',    // Purple - XP/Level
  accent1: '#EC4899',      // Pink - Streak/Hot
  accent2: '#F59E0B',      // Amber - Coins/Rewards
  accent3: '#3B82F6',      // Blue - Info/Tasks
  accent4: '#06B6D4',      // Cyan - Speed/Time
  accent5: '#EF4444',      // Red - Urgent/Error
  accent6: '#A855F7',      // Violet - Special
  
  // Text
  white: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textDim: '#4B5563',
  
  // Status
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Online status
  online: '#10B981',
  offline: '#EF4444',
  busy: '#F59E0B',
  
  // Gradients
  gradientPrimary: ['#10B981', '#059669'],
  gradientGold: ['#F59E0B', '#D97706'],
  gradientPurple: ['#8B5CF6', '#7C3AED'],
  gradientPink: ['#EC4899', '#DB2777'],
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
