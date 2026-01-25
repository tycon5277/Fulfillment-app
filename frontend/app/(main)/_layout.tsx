import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

      {/* Wishes - Agent only - PROMINENT TAB */}
      <Tabs.Screen
        name="wishes"
        options={{
          title: 'Wishes',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.wishesIconContainer,
              focused && styles.wishesIconContainerActive,
              isMobileGenie && styles.wishesIconMobileGenie
            ]}>
              <Ionicons name={focused ? "sparkles" : "sparkles-outline"} size={28} color={focused ? '#FBBF24' : color} />
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '700',
          },
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
});
