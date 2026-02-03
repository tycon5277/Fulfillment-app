import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../src/store';
import * as api from '../src/api';

const COLORS = {
  background: '#FDF8F3',
  cardBg: '#FFFFFF',
  cardBorder: '#E8DFD5',
  primary: '#D97706',
  primaryLight: '#F59E0B',
  success: '#10B981',
  error: '#EF4444',
  text: '#44403C',
  textSecondary: '#78716C',
  textMuted: '#A8A29E',
  white: '#FFFFFF',
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.agent_bio || '');
  const [serviceArea, setServiceArea] = useState(user?.service_area || '');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setSaving(true);
    try {
      // Call API to update profile
      const response = await api.updateProfile({
        name: name.trim(),
        email: email.trim(),
        agent_bio: bio.trim(),
        service_area: serviceArea.trim(),
      });
      
      // Update local state
      setUser({ ...user, ...response.data });
      
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Picture */}
          <View style={styles.avatarSection}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {name ? name.charAt(0).toUpperCase() : '?'}
              </Text>
            </LinearGradient>
            <TouchableOpacity style={styles.changePhotoBtn}>
              <Ionicons name="camera" size={16} color={COLORS.primary} />
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={phone}
                editable={false}
                placeholder="Phone number"
                placeholderTextColor={COLORS.textMuted}
              />
              <Text style={styles.inputHint}>Phone number cannot be changed</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Professional Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio / About</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell customers about yourself and your services..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Service Area</Text>
              <TextInput
                style={styles.input}
                value={serviceArea}
                onChangeText={setServiceArea}
                placeholder="e.g., Koramangala, HSR Layout, Indiranagar"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.white,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  inputDisabled: {
    backgroundColor: COLORS.background,
    color: COLORS.textMuted,
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
});
