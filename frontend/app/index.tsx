import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store';
import * as api from '../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  primary: '#7C3AED',
  background: '#F8F9FA',
  text: '#212529',
};

export default function Index() {
  const router = useRouter();
  const { sessionToken, isLoading, setUser, setSessionToken, loadStoredAuth } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState('Loading...');

  // Handle OAuth callback on web - check URL for session_id
  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (Platform.OS !== 'web' || typeof window === 'undefined') return;

      const hash = window.location.hash;
      const search = window.location.search;
      
      let sessionId = null;
      if (hash.includes('session_id=')) {
        sessionId = hash.split('session_id=')[1]?.split('&')[0];
      } else if (search.includes('session_id=')) {
        const params = new URLSearchParams(search);
        sessionId = params.get('session_id');
      }
      
      if (sessionId) {
        setStatus('Signing you in...');
        // Clean the URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        try {
          console.log('Processing OAuth callback with session_id');
          const response = await api.createSession(sessionId);
          const { user, session_token } = response.data;

          await AsyncStorage.setItem('session_token', session_token);
          setSessionToken(session_token);
          setUser(user);

          console.log('Login successful, user:', user.email);
          
          if (!user.is_agent) {
            router.replace('/register');
          } else {
            router.replace('/(main)/home');
          }
          return true;
        } catch (error: any) {
          console.error('OAuth callback error:', error);
          setStatus('Login failed. Redirecting...');
          setTimeout(() => router.replace('/(auth)/login'), 1500);
          return true;
        }
      }
      return false;
    };

    handleOAuthCallback().then(handled => {
      if (!handled) {
        // Not an OAuth callback, proceed with normal flow
        loadStoredAuth();
      }
    });
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
