import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useAuthStore } from '../store';

// Inactivity timeout - if app was closed for more than 30 minutes, set offline
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

// Check if running in Expo Go (notifications don't work there in SDK 53+)
const isExpoGo = Constants.appOwnership === 'expo';

export const useAppStateManager = () => {
  const { isOnline, setIsOnline, updateLastActivity, user } = useAuthStore();
  const appState = useRef(AppState.currentState);
  const lastBackgroundTime = useRef<number | null>(null);

  // Show/hide persistent notification based on online status
  // Only attempt notifications if not in Expo Go
  useEffect(() => {
    const manageOnlineNotification = async () => {
      // Skip notifications in Expo Go - they're not supported in SDK 53+
      if (isExpoGo) {
        console.log('📱 Running in Expo Go - notifications disabled');
        return;
      }
      
      if (isOnline && user) {
        // Show persistent notification when online
        await showOnlineNotification();
      } else {
        // Remove notification when offline
        await hideOnlineNotification();
      }
    };
    manageOnlineNotification();
  }, [isOnline, user]);

  // Check inactivity on app startup
  useEffect(() => {
    const checkInactivity = async () => {
      try {
        const lastActivityStr = await AsyncStorage.getItem('last_activity_time');
        const wasOnline = await AsyncStorage.getItem('is_online');
        
        if (lastActivityStr && wasOnline === 'true') {
          const lastActivity = parseInt(lastActivityStr, 10);
          const timeSinceLastActivity = Date.now() - lastActivity;
          
          // If inactive for too long, set offline
          if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
            console.log('⏰ Inactivity detected - setting offline');
            await setIsOnline(false);
          }
        }
      } catch (error) {
        console.error('Error checking inactivity:', error);
      }
    };
    
    checkInactivity();
  }, []);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const previousState = appState.current;
      
      // App going to background
      if (previousState === 'active' && nextAppState.match(/inactive|background/)) {
        console.log('📱 App going to background');
        lastBackgroundTime.current = Date.now();
        // Update last activity time when going to background
        await updateLastActivity();
      }
      
      // App coming to foreground
      if (previousState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 App coming to foreground');
        
        if (lastBackgroundTime.current) {
          const timeInBackground = Date.now() - lastBackgroundTime.current;
          
          // If app was in background for more than the timeout, check if should go offline
          if (timeInBackground > INACTIVITY_TIMEOUT && isOnline) {
            console.log('⏰ Long background time - setting offline');
            await setIsOnline(false);
          }
        }
        
        // Update activity time when coming back
        await updateLastActivity();
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isOnline, setIsOnline, updateLastActivity]);

  // Periodically update activity time while app is active
  useEffect(() => {
    if (!isOnline) return;
    
    const interval = setInterval(() => {
      updateLastActivity();
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [isOnline, updateLastActivity]);

  return null;
};

// Show persistent notification when user is online
// Only works in development builds, not Expo Go
export const showOnlineNotification = async () => {
  if (isExpoGo) {
    console.log('📱 Skipping notification in Expo Go');
    return;
  }
  
  try {
    // Dynamically import notifications only when needed
    const Notifications = await import('expo-notifications');
    
    // Request permissions first
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        console.log('Notification permission not granted');
        return;
      }
    }

    // Setup notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('online-status', {
        name: 'Online Status',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0],
        lightColor: '#10B981',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
        showBadge: false,
      });
    }

    // Cancel any existing online notification first
    await Notifications.dismissNotificationAsync('online-status-notification');

    // Schedule a persistent notification
    await Notifications.scheduleNotificationAsync({
      identifier: 'online-status-notification',
      content: {
        title: '🟢 You are Online',
        body: 'You are visible to customers looking for services',
        data: { type: 'online-status' },
        sticky: true,
        autoDismiss: false,
        ...(Platform.OS === 'android' && {
          priority: Notifications.AndroidNotificationPriority.LOW,
          color: '#10B981',
        }),
      },
      trigger: null, // Show immediately
    });
    
    console.log('✅ Online notification shown');
  } catch (error) {
    // Gracefully handle notification errors (e.g., in Expo Go)
    console.log('📱 Notifications not available:', error);
  }
};

// Hide the persistent notification
export const hideOnlineNotification = async () => {
  if (isExpoGo) {
    return;
  }
  
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.dismissNotificationAsync('online-status-notification');
    console.log('✅ Online notification hidden');
  } catch (error) {
    console.log('📱 Could not hide notification:', error);
  }
};

export default useAppStateManager;
