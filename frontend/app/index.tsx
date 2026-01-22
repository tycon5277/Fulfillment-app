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

  useEffect(() => {
    // First, load stored auth
    loadStoredAuth();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      // Wait for auth store to finish loading
      if (isLoading) return;

      // Small delay to ensure navigation is ready
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!sessionToken) {
        console.log('No session token, redirecting to login');
        router.replace('/(auth)/login');
        return;
      }

      try {
        console.log('Checking auth with token...');
        const response = await api.getMe();
        setUser(response.data);
        
        if (!response.data.is_agent) {
          console.log('User is not an agent, redirecting to register');
          router.replace('/register');
        } else {
          console.log('User is an agent, redirecting to home');
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
  }, [isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Loading...</Text>
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
