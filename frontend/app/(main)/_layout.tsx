import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store';
import THEME from '../../src/theme';

export default function MainLayout() {
  const { user } = useAuthStore();
  const partnerType = user?.partner_type;
  const agentType = user?.agent_type;
  const isMobileGenie = partnerType === 'agent' && agentType === 'mobile';
  const insets = useSafeAreaInsets();

  // Get role-specific colors
  const getThemeColors = () => {
    if (isMobileGenie) {
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
          ...(isMobileGenie && {
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
            <View style={[styles.iconContainer, focused && isMobileGenie && styles.iconContainerActive]}>
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />

      {/* Orders - Agent & Vendor */}
      <Tabs.Screen
        name="orders"
        options={{
          title: partnerType === 'vendor' ? 'Orders' : 'Hub Order',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && isMobileGenie && styles.iconContainerActive]}>
              <Ionicons name={focused ? "storefront" : "storefront-outline"} size={24} color={color} />
            </View>
          ),
          href: partnerType === 'promoter' ? null : '/(main)/orders',
        }}
      />

      {/* Wishes - Agent only - MAGICAL FLOATING BUTTON */}
      <Tabs.Screen
        name="wishes"
        options={{
          title: 'Wishes',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.wishesFloatingContainer}>
              {/* Outer gradient ring - Blue to Cyan */}
              <LinearGradient
                colors={['#3B82F6', '#06B6D4', '#22D3EE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.wishesOuterRing}
              >
                {/* Inner gradient ring - Yellow to Orange */}
                <LinearGradient
                  colors={['#F59E0B', '#FBBF24', '#FCD34D']}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.wishesInnerRing}
                >
                  {/* Center button */}
                  <View style={[styles.wishesCenterButton, focused && styles.wishesCenterButtonActive]}>
                    <Ionicons 
                      name={focused ? "sparkles" : "sparkles-outline"} 
                      size={24} 
                      color={focused ? '#FBBF24' : '#FFF'} 
                    />
                  </View>
                </LinearGradient>
              </LinearGradient>
              {/* Glow effect */}
              <View style={styles.wishesGlow} />
            </View>
          ),
          tabBarLabel: () => null, // Hide label for floating button
          href: partnerType === 'agent' ? '/(main)/wishes' : null,
        }}
      />

      {/* Deliveries - Agent only */}
      <Tabs.Screen
        name="deliveries"
        options={{
          title: 'Deliveries',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && isMobileGenie && styles.iconContainerActive]}>
              <Ionicons name={focused ? "rocket" : "rocket-outline"} size={24} color={color} />
            </View>
          ),
          href: partnerType === 'agent' ? '/(main)/deliveries' : null,
        }}
      />

      {/* Products - Vendor only */}
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && isMobileGenie && styles.iconContainerActive]}>
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
            <View style={[styles.iconContainer, focused && isMobileGenie && styles.iconContainerActive]}>
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
            <View style={[styles.iconContainer, focused && isMobileGenie && styles.iconContainerActive]}>
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
            <View style={[styles.iconContainer, focused && isMobileGenie && styles.iconContainerActive]}>
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
  // Wishes tab - Larger and more prominent
  wishesIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 36,
    marginTop: -8,
    borderRadius: 18,
    backgroundColor: THEME.cardBg,
    borderWidth: 2,
    borderColor: THEME.cardBorder,
  },
  wishesIconContainerActive: {
    backgroundColor: '#FBBF24' + '25',
    borderColor: '#FBBF24',
  },
  wishesIconMobileGenie: {
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
