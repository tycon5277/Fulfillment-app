import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Platform, Animated, Text, BackHandler, ToastAndroid, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store';
import THEME from '../../src/theme';

// Animated Wishes Button Component with Pulsing Glow - Violet/Purple Theme
const WishesButton = ({ focused }: { focused: boolean }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.12)).current;

  useEffect(() => {
    // Create pulsing animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    // Create glow animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.15,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    glowAnimation.start();

    return () => {
      pulseAnimation.stop();
      glowAnimation.stop();
    };
  }, []);

  return (
    <View style={styles.wishesContainer}>
      <Animated.View style={[styles.wishesFloatingContainer, { transform: [{ scale: pulseAnim }] }]}>
        {/* Outer gradient ring - Deep Violet to Purple */}
        <LinearGradient
          colors={['#7C3AED', '#8B5CF6', '#A78BFA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.wishesOuterRing}
        >
          {/* Inner gradient ring - Magenta to Pink */}
          <LinearGradient
            colors={['#C026D3', '#D946EF', '#E879F9']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.wishesInnerRing}
          >
            {/* Center button */}
            <View style={[styles.wishesCenterButton, focused && styles.wishesCenterButtonActive]}>
              <Ionicons 
                name={focused ? "sparkles" : "sparkles-outline"} 
                size={24} 
                color={focused ? '#D946EF' : '#FFF'} 
              />
            </View>
          </LinearGradient>
        </LinearGradient>
        {/* Animated Glow effect - Violet */}
        <Animated.View style={[styles.wishesGlow, { opacity: glowAnim }]} />
      </Animated.View>
      <Text style={styles.wishesLabel}>Wishes</Text>
    </View>
  );
};

export default function MainLayout() {
  const { user, isLoading, isUserLoaded } = useAuthStore();
  const insets = useSafeAreaInsets();
  
  // CRITICAL: Compute user type ONLY from the user object
  // These values determine which tabs to show
  const partnerType = user?.partner_type;
  const agentType = user?.agent_type;
  
  // Explicit type checks - must be exactly 'agent' AND 'mobile'/'skilled'
  const isMobileGenie = partnerType === 'agent' && agentType === 'mobile';
  const isSkilledGenie = partnerType === 'agent' && agentType === 'skilled';
  const isAgent = partnerType === 'agent';
  
  // Debug logging for tab configuration
  console.log('📱 Tab Layout - User:', {
    isUserLoaded,
    partnerType,
    agentType,
    isSkilledGenie,
    isMobileGenie,
    skills: user?.agent_skills?.length || 0
  });

  const router = useRouter();
  const pathname = usePathname();
  
  // Track back button presses for "press twice to exit" feature
  const lastBackPressRef = useRef<number>(0);
  const [showExitToast, setShowExitToast] = useState(false);

  // Handle hardware back button - only for main tab screens
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      const currentPath = pathname;
      
      // Define MAIN TAB routes (bottom navigation tabs only)
      const mainTabRoutes = [
        '/skilled-home',
        '/home',
        '/nearby-wishes',
        '/appointments',
        '/skilled-profile',
        '/profile',
        '/wishes',
        '/my-quests',
        '/products',
        '/events',
        '/bookings',
      ];
      
      // Check if current path is a MAIN TAB screen
      const isOnMainTab = mainTabRoutes.some(route => {
        const cleanPath = currentPath.replace('/(main)', '');
        return cleanPath === route || cleanPath.endsWith(route);
      });
      
      // If NOT on a main tab (e.g., chat, earnings detail, reviews, etc.)
      // Let the default back behavior work (go to previous screen)
      if (!isOnMainTab) {
        return false; // Let system handle normal back navigation
      }
      
      // Define home routes
      const homeRoutes = ['/skilled-home', '/home'];
      
      // Check if we're on the home screen
      const isOnHomeScreen = homeRoutes.some(route => {
        const cleanPath = currentPath.replace('/(main)', '');
        return cleanPath === route || cleanPath.endsWith(route);
      });
      
      if (isOnHomeScreen) {
        // Implement "press back twice to exit"
        const now = Date.now();
        const timeSinceLastPress = now - lastBackPressRef.current;
        
        if (timeSinceLastPress < 2000) {
          // Second press within 2 seconds - exit app
          BackHandler.exitApp();
          return true;
        } else {
          // First press - show warning
          lastBackPressRef.current = now;
          
          // Show toast on Android, Alert on iOS
          if (Platform.OS === 'android') {
            ToastAndroid.show('Press back again to exit app', ToastAndroid.SHORT);
          } else {
            // For iOS, show a brief visual indicator
            setShowExitToast(true);
            setTimeout(() => setShowExitToast(false), 2000);
          }
          
          return true; // Prevent default (don't exit yet)
        }
      }
      
      // On other main tabs (Work Orders, Schedule, Profile) -> go to Home
      if (isSkilledGenie) {
        router.replace('/(main)/skilled-home');
      } else {
        router.replace('/(main)/home');
      }
      
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [pathname, isSkilledGenie, router]);

  // Show loading screen until user data is FULLY loaded from server
  // AND the user has valid partner info (to prevent tab glitch)
  // This is a more robust check - wait for full user data including type
  if (!isUserLoaded || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FDF8F3', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>✨</Text>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#44403C', marginBottom: 8 }}>QuickWish</Text>
        <Text style={{ fontSize: 14, color: '#78716C' }}>Loading your dashboard...</Text>
      </View>
    );
  }

  // Get role-specific colors
  const getThemeColors = () => {
    if (isSkilledGenie) {
      // Light professional theme for Skilled Genie
      return {
        background: '#FDF8F3',  // Warm cream for Skilled Genie
        border: '#E8DFD5',
        active: '#D97706',  // Warm amber
        inactive: '#A8A29E',
      };
    }
    if (isMobileGenie) {
      // Dark gamified theme for Carpet Genie
      return {
        background: THEME.backgroundSecondary,
        border: THEME.cardBorder,
        active: THEME.primary,
        inactive: THEME.textMuted,
      };
    }
    // Default light theme for vendors/promoters
    return {
      background: '#FFFFFF',
      border: '#E5E7EB',
      active: '#7C3AED',
      inactive: '#9CA3AF',
    };
  };

  const colors = getThemeColors();
  const tabBarHeight = isSkilledGenie ? 56 + insets.bottom : 65 + insets.bottom;

  // Set initial route based on user type
  const initialRoute = isSkilledGenie ? 'skilled-home' : 'home';

  return (
    <>
    <Tabs
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: tabBarHeight,
          paddingBottom: insets.bottom + (isSkilledGenie ? 4 : 8),
          paddingTop: isSkilledGenie ? 8 : 10,
          ...(isMobileGenie && {
            shadowColor: THEME.primary,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 10,
          }),
          ...(isSkilledGenie && {
            shadowColor: '#64748B',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }),
        },
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
        tabBarLabelStyle: {
          fontSize: isSkilledGenie ? 10 : 11,
          fontWeight: '600',
          marginTop: isSkilledGenie ? 2 : 4,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      {/* Home - For Mobile Genie & non-Agent partners */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && isAgent && styles.iconContainerActive]}>
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
            </View>
          ),
          href: (user && !isSkilledGenie) ? '/(main)/home' : (!user ? '/(main)/home' : null),
        }}
      />

      {/* Skilled Home - For Skilled Genie only (shown in tab bar) */}
      <Tabs.Screen
        name="skilled-home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerSkilledActive]}>
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
            </View>
          ),
          href: (user && isSkilledGenie) ? '/(main)/skilled-home' : null,
        }}
      />

      {/* Orders - Mobile Genie & Vendor ONLY (NOT for Skilled Genie) */}
      <Tabs.Screen
        name="orders"
        options={{
          title: partnerType === 'vendor' ? 'Orders' : 'Hub Order',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && isAgent && styles.iconContainerActive]}>
              <Ionicons name={focused ? "storefront" : "storefront-outline"} size={24} color={color} />
            </View>
          ),
          href: (isMobileGenie || partnerType === 'vendor') ? '/(main)/orders' : null,
        }}
      />

      {/* Work Orders - Skilled Genie only (replaces Service Requests) */}
      <Tabs.Screen
        name="nearby-wishes"
        options={{
          title: 'Work Orders',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerSkilledActive]}>
              <Ionicons name={focused ? "briefcase" : "briefcase-outline"} size={24} color={color} />
            </View>
          ),
          href: (user && isSkilledGenie) ? '/(main)/nearby-wishes' : null,
        }}
      />

      {/* Service Requests - Hidden now, replaced by nearby-wishes */}
      <Tabs.Screen
        name="service-requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && isAgent && styles.iconContainerActive]}>
              <Ionicons name={focused ? "briefcase" : "briefcase-outline"} size={24} color={color} />
            </View>
          ),
          href: null, // Hidden - replaced by nearby-wishes
        }}
      />

      {/* Wishes - Mobile Genie only - MAGICAL FLOATING BUTTON */}
      <Tabs.Screen
        name="wishes"
        options={{
          title: 'Wishes',
          tabBarIcon: ({ color, focused }) => (
            <WishesButton focused={focused} />
          ),
          tabBarLabel: () => null, // Label is part of the custom component
          href: isMobileGenie ? '/(main)/wishes' : null,
        }}
      />

      {/* My Quests - Mobile Genie only (hidden if user not loaded) */}
      <Tabs.Screen
        name="my-quests"
        options={{
          title: 'My Quests',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && isAgent && styles.iconContainerActive]}>
              <Ionicons name={focused ? "trophy" : "trophy-outline"} size={24} color={color} />
            </View>
          ),
          href: (user && isMobileGenie) ? '/(main)/my-quests' : null,
        }}
      />

      {/* Appointments - Skilled Genie only (replaces My Jobs) */}
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerSkilledActive]}>
              <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
            </View>
          ),
          href: (user && isSkilledGenie) ? '/(main)/appointments' : null,
        }}
      />

      {/* Skilled Chats - Skilled Genie only */}
      <Tabs.Screen
        name="skilled-chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerSkilledActive]}>
              <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={24} color={color} />
            </View>
          ),
          href: (user && isSkilledGenie) ? '/(main)/skilled-chats' : null,
        }}
      />

      {/* My Jobs - Hidden, replaced by appointments */}
      <Tabs.Screen
        name="my-jobs"
        options={{
          title: 'My Jobs',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && isAgent && styles.iconContainerActive]}>
              <Ionicons name={focused ? "construct" : "construct-outline"} size={24} color={color} />
            </View>
          ),
          href: null, // Hidden - replaced by appointments
        }}
      />

      {/* Products - Vendor only */}
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && isAgent && styles.iconContainerActive]}>
              <Ionicons name={focused ? "pricetags" : "pricetags-outline"} size={24} color={color} />
            </View>
          ),
          href: partnerType === 'vendor' ? '/(main)/products' : null,
        }}
      />

      {/* Events - Promoter only */}
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer]}>
              <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
            </View>
          ),
          href: partnerType === 'promoter' ? '/(main)/events' : null,
        }}
      />

      {/* Bookings - Promoter only */}
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer]}>
              <Ionicons name={focused ? "ticket" : "ticket-outline"} size={24} color={color} />
            </View>
          ),
          href: partnerType === 'promoter' ? '/(main)/bookings' : null,
        }}
      />

      {/* Profile - Non-skilled partners (Mobile Genie, Vendor, Promoter) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && isAgent && styles.iconContainerActive]}>
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
            </View>
          ),
          href: isSkilledGenie ? null : '/(main)/profile',
        }}
      />

      {/* Skilled Profile - Skilled Genie only with dedicated earnings */}
      <Tabs.Screen
        name="skilled-profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerSkilledActive]}>
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
            </View>
          ),
          href: isSkilledGenie ? '/(main)/skilled-profile' : null,
        }}
      />

      {/* Hidden screens for wish detail (accessed via push navigation) */}
      <Tabs.Screen
        name="wish-detail"
        options={{
          href: null,
        }}
      />

      {/* Hidden screens for detail pages (accessed via navigation, not tabs) */}
      <Tabs.Screen
        name="earnings-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="reviews-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="appointments-summary"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="appointment-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="tracking-demo"
        options={{
          href: null,
        }}
      />
    </Tabs>

    {/* Exit Toast for iOS */}
    {showExitToast && Platform.OS === 'ios' && (
      <View style={styles.exitToastContainer}>
        <View style={styles.exitToast}>
          <Text style={styles.exitToastText}>Press back again to exit app</Text>
        </View>
      </View>
    )}
    </>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 28,
  },
  iconContainerActive: {
    backgroundColor: THEME.primary + '20',
    borderRadius: 14,
  },
  iconContainerSkilledActive: {
    backgroundColor: '#D97706' + '20', // Warm amber for Skilled Genie
    borderRadius: 14,
  },
  // Magical Floating Wishes Button - Violet Theme
  wishesContainer: {
    alignItems: 'center',
    marginTop: -20,
    width: 70,
  },
  wishesFloatingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wishesOuterRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  wishesInnerRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  wishesCenterButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0D0D12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishesCenterButtonActive: {
    backgroundColor: '#1A1A24',
  },
  wishesGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#A855F7',
    zIndex: -1,
  },
  wishesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A855F7',
    marginTop: 4,
    textAlign: 'center',
  },
  // Exit Toast Styles
  exitToastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  exitToast: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  exitToastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
