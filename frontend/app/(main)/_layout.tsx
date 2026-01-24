import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { useAuthStore } from '../../src/store';

const COLORS = {
  primary: '#7C3AED',
  secondary: '#0EA5E9',
  amber: '#F59E0B',
  inactive: '#9CA3AF',
  background: '#FFFFFF',
};

export default function MainLayout() {
  const { user } = useAuthStore();
  const partnerType = user?.partner_type;

  // Get role-specific primary color
  const getPrimaryColor = () => {
    switch (partnerType) {
      case 'agent': return COLORS.primary;
      case 'vendor': return COLORS.secondary;
      case 'promoter': return COLORS.amber;
      default: return COLORS.primary;
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: getPrimaryColor(),
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {/* Home - All partners */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      {/* Orders - Agent & Vendor */}
      <Tabs.Screen
        name="orders"
        options={{
          title: partnerType === 'vendor' ? 'Orders' : 'Available',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={partnerType === 'vendor' ? 'receipt' : 'cube'} size={size} color={color} />
          ),
          href: partnerType === 'promoter' ? null : '/(main)/orders',
        }}
      />

      {/* Wishes - Agent only */}
      <Tabs.Screen
        name="wishes"
        options={{
          title: 'Wishes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="star" size={size} color={color} />
          ),
          href: partnerType === 'agent' ? '/(main)/wishes' : null,
        }}
      />

      {/* Deliveries - Agent only */}
      <Tabs.Screen
        name="deliveries"
        options={{
          title: 'Deliveries',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bicycle" size={size} color={color} />
          ),
          href: partnerType === 'agent' ? '/(main)/deliveries' : null,
        }}
      />

      {/* Products - Vendor only */}
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetags" size={size} color={color} />
          ),
          href: partnerType === 'vendor' ? '/(main)/products' : null,
        }}
      />

      {/* Events - Promoter only */}
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
          href: partnerType === 'promoter' ? '/(main)/events' : null,
        }}
      />

      {/* Bookings - Promoter only */}
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ticket" size={size} color={color} />
          ),
          href: partnerType === 'promoter' ? '/(main)/bookings' : null,
        }}
      />

      {/* Profile - All partners */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
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
  tabBar: {
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
