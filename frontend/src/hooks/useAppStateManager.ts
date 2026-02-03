import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../store';

// Inactivity timeout - if app was closed for more than 30 minutes, set offline
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

// Notification channel for Android
const ONLINE_NOTIFICATION_ID = 'online-status-notification';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowInForeground: false,
  }),
});

export const useAppStateManager = () => {
  const { isOnline, setIsOnline, updateLastActivity, user } = useAuthStore();
  const appState = useRef(AppState.currentState);
  const lastBackgroundTime = useRef<number | null>(null);

  // Setup notification channel for Android
  useEffect(() => {
    const setupNotificationChannel = async () => {
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
    };
    setupNotificationChannel();
  }, []);

  // Show/hide persistent notification based on online status
  useEffect(() => {
    const manageOnlineNotification = async () => {
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
export const showOnlineNotification = async () => {
  try {
    // Request permissions first
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        console.log('Notification permission not granted');
        return;
      }
    }

    // Cancel any existing online notification first
    await Notifications.dismissNotificationAsync(ONLINE_NOTIFICATION_ID);

    // Schedule a persistent notification
    await Notifications.scheduleNotificationAsync({
      identifier: ONLINE_NOTIFICATION_ID,
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
    console.error('Error showing online notification:', error);
  }
};

// Hide the persistent notification
export const hideOnlineNotification = async () => {
  try {
    await Notifications.dismissNotificationAsync(ONLINE_NOTIFICATION_ID);
    console.log('✅ Online notification hidden');
  } catch (error) {
    console.error('Error hiding online notification:', error);
  }
};

export default useAppStateManager;
