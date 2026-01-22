import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../src/store';
import * as api from '../../src/api';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#7C3AED',
  secondary: '#0EA5E9',
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#212529',
  textSecondary: '#6C757D',
  lavender: '#E8D9F4',
};

const AUTH_URL = 'https://demobackend.emergentagent.com/auth/v1/env/oauth/google-login';

export default function LoginScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setSessionToken } = useAuthStore();

  const handleGoogleLogin = () => {
    setShowWebView(true);
  };

  const handleNavigationChange = async (navState: any) => {
    const { url } = navState;
    
    if (url.includes('session_id=')) {
      const sessionId = url.split('session_id=')[1]?.split('&')[0];
      
      if (sessionId) {
        setShowWebView(false);
        setIsLoading(true);
        
        try {
          const response = await api.createSession(sessionId);
          const { user, session_token } = response.data;
          
          await AsyncStorage.setItem('session_token', session_token);
          setSessionToken(session_token);
          setUser(user);
          
          if (!user.is_agent) {
            router.replace('/register');
          } else {
            router.replace('/(main)/home');
          }
        } catch (error) {
          console.error('Login error:', error);
          setIsLoading(false);
        }
      }
    }
  };

  if (showWebView) {
    return (
      <SafeAreaView style={styles.webViewContainer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowWebView(false)}
        >
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <WebView
          ref={webViewRef}
          source={{ uri: AUTH_URL }}
          onNavigationStateChange={handleNavigationChange}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </SafeAreaView>
    );
  }

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
  webViewContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  closeButton: {
    padding: 16,
    alignItems: 'flex-end',
  },
  webView: {
    flex: 1,
  },
});
