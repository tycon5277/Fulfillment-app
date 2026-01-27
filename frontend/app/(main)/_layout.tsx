import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Platform, Animated, Text } from 'react-native';
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
  const { user, isLoading } = useAuthStore();
  const partnerType = user?.partner_type;
  const agentType = user?.agent_type;
  const isMobileGenie = partnerType === 'agent' && agentType === 'mobile';
  const isSkilledGenie = partnerType === 'agent' && agentType === 'skilled';
  const isAgent = partnerType === 'agent';
  const insets = useSafeAreaInsets();

  // Show loading screen while user data is being fetched to prevent tab glitch
  if (isLoading || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FDF8F3', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 32, marginBottom: 12 }}>✨</Text>
        <Text style={{ fontSize: 16, color: '#78716C' }}>Loading...</Text>
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

      {/* Nearby Wishes - Skilled Genie only (replaces Service Requests) */}
      <Tabs.Screen
        name="nearby-wishes"
        options={{
          title: 'Nearby',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerSkilledActive]}>
              <Ionicons name={focused ? "location" : "location-outline"} size={24} color={color} />
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
    </Tabs>
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
    backgroundColor: '#2563EB' + '20', // Professional Blue for Skilled Genie
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
});
