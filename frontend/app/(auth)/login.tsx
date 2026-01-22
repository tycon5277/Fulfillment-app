import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../src/store';
import * as api from '../../src/api';

const COLORS = {
  primary: '#7C3AED',
  secondary: '#0EA5E9',
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#212529',
  textSecondary: '#6C757D',
  lavender: '#E8D9F4',
};

export default function LoginScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setSessionToken } = useAuthStore();

  // Call maybeCompleteAuthSession inside useEffect to avoid cross-origin issues
  useEffect(() => {
    if (Platform.OS !== 'web') {
      WebBrowser.maybeCompleteAuthSession();
    }
  }, []);

  // Get the correct redirect URL based on platform
  const getRedirectUrl = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        return window.location.origin + '/';
      }
      return '/';
    }
    // For mobile Expo Go, use exp:// URL scheme
    return Linking.createURL('/');
  };

  // Parse session_id from URL (supports both hash and query)
  const parseSessionId = (url: string): string | null => {
    if (!url) return null;
    
    // Check hash fragment first: #session_id=xxx
    if (url.includes('#session_id=')) {
      return url.split('#session_id=')[1]?.split('&')[0] || null;
    }
    // Check query parameter: ?session_id=xxx
    if (url.includes('session_id=')) {
      try {
        const urlObj = new URL(url);
        return urlObj.searchParams.get('session_id');
      } catch {
        // If URL parsing fails, try regex
        const match = url.match(/session_id=([^&]+)/);
        return match ? match[1] : null;
      }
    }
    return null;
  };

  // Exchange session_id for session_token
  const handleSessionExchange = async (sessionId: string) => {
    if (!sessionId) return;
    
    setIsLoading(true);
    try {
      console.log('Exchanging session_id for session_token...');
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
    } catch (error: any) {
      console.error('Session exchange error:', error.response?.data || error.message);
      setIsLoading(false);
    }
  };

  // Handle initial URL (cold start) - web only
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
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
        // Clean the URL
        window.history.replaceState({}, document.title, window.location.pathname);
        handleSessionExchange(sessionId);
      }
    }
  }, []);

  // Handle deep link for mobile cold start
  useEffect(() => {
    if (Platform.OS === 'web') return;
    
    const checkInitialUrl = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const sessionId = parseSessionId(initialUrl);
          if (sessionId) {
            await handleSessionExchange(sessionId);
          }
        }
      } catch (error) {
        console.error('Error checking initial URL:', error);
      }
    };

    checkInitialUrl();
  }, []);

  // Handle deep link when app is running (hot link)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    
    const subscription = Linking.addEventListener('url', async (event) => {
      const sessionId = parseSessionId(event.url);
      if (sessionId) {
        await handleSessionExchange(sessionId);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const redirectUrl = getRedirectUrl();
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      
      console.log('Opening auth URL:', authUrl);
      console.log('Redirect URL:', redirectUrl);

      if (Platform.OS === 'web') {
        // For web, redirect directly
        window.location.href = authUrl;
        return;
      }

      // For mobile, use WebBrowser.openAuthSessionAsync
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      
      console.log('WebBrowser result:', JSON.stringify(result));

      if (result.type === 'success' && result.url) {
        const sessionId = parseSessionId(result.url);
        console.log('Parsed session_id:', sessionId);
        if (sessionId) {
          await handleSessionExchange(sessionId);
          return;
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Auth error:', error);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="flash" size={48} color={COLORS.white} />
          </View>
          <Text style={styles.appName}>QuickWish</Text>
          <Text style={styles.tagline}>Fulfillment Agent</Text>
        </View>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Ionicons name="bicycle" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>Accept delivery orders</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="star" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>Fulfill customer wishes</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="wallet" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>Earn on your schedule</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.text} />
          ) : (
            <>
              <Image
                source={{ uri: 'https://www.google.com/favicon.ico' }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '600',
  },
  featureList: {
    marginBottom: 48,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  terms: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
