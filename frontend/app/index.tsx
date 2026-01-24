import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store';
import * as api from '../src/api';

const COLORS = {
  primary: '#7C3AED',
  background: '#F8F9FA',
  text: '#212529',
};

export default function Index() {
  const router = useRouter();
  const { sessionToken, isLoading, setUser, loadStoredAuth } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    loadStoredAuth();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      // Wait for auth store to finish loading
      if (isLoading) return;

      // Small delay to ensure navigation is ready
      await new Promise(resolve => setTimeout(resolve, 300));

      if (!sessionToken) {
        console.log('No session token, redirecting to login');
        router.replace('/(auth)/login');
        return;
      }

      try {
        setStatus('Checking session...');
        console.log('Checking auth with token...');
        const response = await api.getMe();
        setUser(response.data);
        
        // Check if user has completed profile setup
        const user = response.data;
        
        if (!user.name) {
          // User needs to complete basic profile first
          console.log('User needs to complete profile, redirecting to register');
          router.replace('/register');
        } else if (!user.partner_type) {
          // User has profile but needs to select role
          console.log('User needs to select role, redirecting to role-select');
          router.replace('/role-select');
        } else {
          // User is fully registered
          console.log('User is fully registered, redirecting to home');
          router.replace('/(main)/home');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.replace('/(auth)/login');
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [isLoading, sessionToken]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text,
  },
});
