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
  const { user } = useAuthStore();
  const partnerType = user?.partner_type;
  const agentType = user?.agent_type;
  const isMobileGenie = partnerType === 'agent' && agentType === 'mobile';
  const isSkilledGenie = partnerType === 'agent' && agentType === 'skilled';
  const isAgent = partnerType === 'agent';
  const insets = useSafeAreaInsets();

  // Get role-specific colors
  const getThemeColors = () => {
    if (isAgent) {
      return {
        background: THEME.backgroundSecondary,
        border: THEME.cardBorder,
        active: THEME.primary,
        inactive: THEME.textMuted,
      };
    }
    // Default light theme for other types
    return {
      background: '#FFFFFF',
      border: '#E5E7EB',
      active: '#7C3AED',
      inactive: '#9CA3AF',
    };
  };

  const colors = getThemeColors();
  const tabBarHeight = 65 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 8,
          paddingTop: 10,
          ...(isAgent && {
            shadowColor: THEME.primary,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 10,
          }),
        },
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      {/* Home - All partners */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && isAgent && styles.iconContainerActive]}>
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />

      {/* Skilled Home - For Skilled Genie only */}
      <Tabs.Screen
        name="skilled-home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && isAgent && styles.iconContainerActive]}>
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
            </View>
          ),
          href: null, // Hidden - we use conditional redirect instead
        }}
      />

      {/* Orders - Mobile Genie & Vendor */}
      <Tabs.Screen
        name="orders"
        options={{
          title: partnerType === 'vendor' ? 'Orders' : 'Hub Order',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && isAgent && styles.iconContainerActive]}>
              <Ionicons name={focused ? "storefront" : "storefront-outline"} size={24} color={color} />
            </View>
          ),
          href: (partnerType === 'promoter' || isSkilledGenie) ? null : '/(main)/orders',
        }}
      />

      {/* Service Requests - Skilled Genie only */}
      <Tabs.Screen
        name="service-requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && isAgent && styles.iconContainerActive]}>
              <Ionicons name={focused ? "briefcase" : "briefcase-outline"} size={24} color={color} />
            </View>
          ),
          href: isSkilledGenie ? '/(main)/service-requests' : null,
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

      {/* My Quests - Mobile Genie only */}
      <Tabs.Screen
        name="my-quests"
        options={{
          title: 'My Quests',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && isAgent && styles.iconContainerActive]}>
              <Ionicons name={focused ? "trophy" : "trophy-outline"} size={24} color={color} />
            </View>
          ),
          href: isMobileGenie ? '/(main)/my-quests' : null,
        }}
      />

      {/* My Jobs - Skilled Genie only */}
      <Tabs.Screen
        name="my-jobs"
        options={{
          title: 'My Jobs',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && isAgent && styles.iconContainerActive]}>
              <Ionicons name={focused ? "construct" : "construct-outline"} size={24} color={color} />
            </View>
          ),
          href: isSkilledGenie ? '/(main)/my-jobs' : null,
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

      {/* Profile - All partners */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && isAgent && styles.iconContainerActive]}>
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />

      {/* Hidden screens for chat */}
      <Tabs.Screen
        name="chat/[roomId]"
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
