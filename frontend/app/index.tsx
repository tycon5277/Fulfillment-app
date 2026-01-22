import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store';
import * as api from '../src/api';

const COLORS = {
  primary: '#7C3AED',
  background: '#F8F9FA',
};

export default function Index() {
  const router = useRouter();
  const { user, sessionToken, isLoading, setUser, setIsLoading } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      if (isLoading) return;

      if (!sessionToken) {
        router.replace('/(auth)/login');
        return;
      }

      try {
        const response = await api.getMe();
        setUser(response.data);
        
        if (!response.data.is_agent) {
          router.replace('/register');
        } else {
          router.replace('/(main)/home');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.replace('/(auth)/login');
      }
    };

    checkAuth();
  }, [isLoading, sessionToken]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
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
});
