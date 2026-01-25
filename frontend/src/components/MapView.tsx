import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface MapViewProps {
  html: string;
  style?: any;
}

// Web-specific map component using iframe
export default function MapView({ html, style }: MapViewProps) {
  if (Platform.OS === 'web') {
    // For web, we need to use a proper iframe element
    return (
      <View style={[styles.container, style]}>
        <iframe
          srcDoc={html}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: 0,
          }}
          title="Navigation Map"
          sandbox="allow-scripts allow-same-origin"
        />
      </View>
    );
  }
  
  // For native, use WebView
  const { WebView } = require('react-native-webview');
  return (
    <WebView
      source={{ html }}
      style={[styles.container, style]}
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      javaScriptEnabled={true}
      domStorageEnabled={true}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
