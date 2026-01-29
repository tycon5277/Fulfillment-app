import { useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { useAuthStore, LocationData } from '../store';
import * as api from '../api';

// Constants for tracking intervals
const ONLINE_TRACKING_INTERVAL = 5000; // 5 seconds when online (continuous)
const OFFLINE_TRACKING_INTERVAL = 5 * 60 * 1000; // 5 minutes when offline

// Location accuracy settings
const LOCATION_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.High,
  distanceInterval: 10, // Update if moved 10 meters
  timeInterval: ONLINE_TRACKING_INTERVAL,
};

export function useLocationTracking() {
  const { 
    user,
    isOnline, 
    sessionToken,
    currentLocation,
    locationPermissionGranted,
    isTrackingLocation,
    setCurrentLocation, 
    setLocationPermissionGranted,
    setIsTrackingLocation
  } = useAuthStore();

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const offlineIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Request location permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      console.log('📍 Requesting location permissions...');
      
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.log('❌ Foreground location permission denied');
        setLocationPermissionGranted(false);
        return false;
      }

      // Request background permissions for continuous tracking (optional, may not work on all devices)
      if (Platform.OS !== 'web') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        console.log('📍 Background permission status:', backgroundStatus);
      }

      console.log('✅ Location permissions granted');
      setLocationPermissionGranted(true);
      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      setLocationPermissionGranted(false);
      return false;
    }
  }, [setLocationPermissionGranted]);

  // Get current location once
  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    try {
      if (!locationPermissionGranted) {
        const granted = await requestPermissions();
        if (!granted) return null;
      }

      console.log('📍 Getting current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        altitude: location.coords.altitude || undefined,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
        timestamp: location.timestamp,
      };

      console.log('📍 Current location:', locationData.latitude, locationData.longitude);
      setCurrentLocation(locationData);
      
      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }, [locationPermissionGranted, requestPermissions, setCurrentLocation]);

  // Send location to backend
  const syncLocationToBackend = useCallback(async (location: LocationData) => {
    if (!sessionToken || !user?.user_id) return;

    try {
      console.log('📡 Syncing location to backend...');
      await api.updateLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        heading: location.heading,
        speed: location.speed,
        timestamp: location.timestamp,
        is_online: isOnline,
      });
      console.log('✅ Location synced to backend');
    } catch (error) {
      console.error('Error syncing location to backend:', error);
    }
  }, [sessionToken, user?.user_id, isOnline]);

  // Handle location update
  const handleLocationUpdate = useCallback((location: Location.LocationObject) => {
    const locationData: LocationData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || undefined,
      altitude: location.coords.altitude || undefined,
      heading: location.coords.heading || undefined,
      speed: location.coords.speed || undefined,
      timestamp: location.timestamp,
    };

    console.log('📍 Location update:', locationData.latitude, locationData.longitude, isOnline ? '(ONLINE)' : '(OFFLINE)');
    setCurrentLocation(locationData);
    syncLocationToBackend(locationData);
  }, [setCurrentLocation, syncLocationToBackend, isOnline]);

  // Start continuous location tracking (when ONLINE)
  const startContinuousTracking = useCallback(async () => {
    try {
      if (!locationPermissionGranted) {
        const granted = await requestPermissions();
        if (!granted) return;
      }

      // Stop any existing tracking
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }

      console.log('🟢 Starting continuous location tracking (ONLINE mode)');
      setIsTrackingLocation(true);

      // Get initial location
      await getCurrentLocation();

      // Start watching location
      locationSubscription.current = await Location.watchPositionAsync(
        LOCATION_OPTIONS,
        handleLocationUpdate
      );
    } catch (error) {
      console.error('Error starting continuous tracking:', error);
      setIsTrackingLocation(false);
    }
  }, [locationPermissionGranted, requestPermissions, getCurrentLocation, handleLocationUpdate, setIsTrackingLocation]);

  // Start periodic location tracking (when OFFLINE)
  const startPeriodicTracking = useCallback(async () => {
    try {
      if (!locationPermissionGranted) {
        const granted = await requestPermissions();
        if (!granted) return;
      }

      // Stop continuous tracking if active
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }

      // Clear any existing interval
      if (offlineIntervalRef.current) {
        clearInterval(offlineIntervalRef.current);
      }

      console.log('🟡 Starting periodic location tracking (OFFLINE mode - every 5 min)');
      setIsTrackingLocation(true);

      // Get initial location
      const location = await getCurrentLocation();
      if (location) {
        syncLocationToBackend(location);
      }

      // Set up periodic updates
      offlineIntervalRef.current = setInterval(async () => {
        console.log('⏰ Periodic location update (5 min interval)');
        const loc = await getCurrentLocation();
        if (loc) {
          syncLocationToBackend(loc);
        }
      }, OFFLINE_TRACKING_INTERVAL);
    } catch (error) {
      console.error('Error starting periodic tracking:', error);
      setIsTrackingLocation(false);
    }
  }, [locationPermissionGranted, requestPermissions, getCurrentLocation, syncLocationToBackend, setIsTrackingLocation]);

  // Stop all location tracking
  const stopTracking = useCallback(() => {
    console.log('🔴 Stopping location tracking');
    
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    if (offlineIntervalRef.current) {
      clearInterval(offlineIntervalRef.current);
      offlineIntervalRef.current = null;
    }

    setIsTrackingLocation(false);
  }, [setIsTrackingLocation]);

  // Handle online/offline state changes
  useEffect(() => {
    if (!user || !locationPermissionGranted) return;

    if (isOnline) {
      // User went ONLINE - start continuous tracking
      startContinuousTracking();
    } else {
      // User went OFFLINE - switch to periodic tracking
      startPeriodicTracking();
    }

    return () => {
      // Cleanup handled by stopTracking
    };
  }, [isOnline, user, locationPermissionGranted]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - refresh location
        console.log('📱 App came to foreground - refreshing location');
        if (isTrackingLocation) {
          getCurrentLocation();
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isTrackingLocation, getCurrentLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    currentLocation,
    locationPermissionGranted,
    isTrackingLocation,
    requestPermissions,
    getCurrentLocation,
    startContinuousTracking,
    startPeriodicTracking,
    stopTracking,
  };
}
