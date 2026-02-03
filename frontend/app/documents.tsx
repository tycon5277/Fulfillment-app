import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../src/store';

const COLORS = {
  background: '#FDF8F3',
  cardBg: '#FFFFFF',
  cardBorder: '#E8DFD5',
  primary: '#D97706',
  primaryLight: '#F59E0B',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#44403C',
  textSecondary: '#78716C',
  textMuted: '#A8A29E',
  white: '#FFFFFF',
};

interface Document {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  required: boolean;
}

const DOCUMENT_TYPES: Document[] = [
  {
    id: 'aadhar',
    name: 'Aadhar Card',
    description: 'Government issued ID proof',
    icon: 'card',
    status: 'pending',
    required: true,
  },
  {
    id: 'pan',
    name: 'PAN Card',
    description: 'For tax purposes',
    icon: 'document-text',
    status: 'pending',
    required: true,
  },
  {
    id: 'photo',
    name: 'Profile Photo',
    description: 'Clear face photo',
    icon: 'person',
    status: 'pending',
    required: true,
  },
  {
    id: 'address',
    name: 'Address Proof',
    description: 'Utility bill or bank statement',
    icon: 'home',
    status: 'pending',
    required: false,
  },
  {
    id: 'certificate',
    name: 'Skill Certificate',
    description: 'Training or certification (if any)',
    icon: 'ribbon',
    status: 'pending',
    required: false,
  },
];

export default function DocumentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>(DOCUMENT_TYPES);
  const [uploading, setUploading] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return COLORS.success;
      case 'uploaded':
        return COLORS.warning;
      case 'rejected':
        return COLORS.error;
      default:
        return COLORS.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return 'checkmark-circle';
      case 'uploaded':
        return 'time';
      case 'rejected':
        return 'close-circle';
      default:
        return 'cloud-upload';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'uploaded':
        return 'Under Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Upload';
    }
  };

  const handleUploadDocument = async (docId: string) => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload documents.');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(docId);
        
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update document status
        setDocuments(prev => 
          prev.map(doc => 
            doc.id === docId ? { ...doc, status: 'uploaded' as const } : doc
          )
        );
        
        Alert.alert('Success', 'Document uploaded successfully! It will be reviewed shortly.');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const handleTakePhoto = async (docId: string) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(docId);
        
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update document status
        setDocuments(prev => 
          prev.map(doc => 
            doc.id === docId ? { ...doc, status: 'uploaded' as const } : doc
          )
        );
        
        Alert.alert('Success', 'Document uploaded successfully! It will be reviewed shortly.');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const showUploadOptions = (docId: string, docName: string) => {
    Alert.alert(
      `Upload ${docName}`,
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => handleTakePhoto(docId) },
        { text: 'Choose from Gallery', onPress: () => handleUploadDocument(docId) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const requiredDocs = documents.filter(d => d.required);
  const optionalDocs = documents.filter(d => !d.required);
  const verifiedCount = documents.filter(d => d.status === 'verified').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Documents</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressGradient}
          >
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Verification Progress</Text>
              <Text style={styles.progressText}>
                {verifiedCount} of {documents.length} documents verified
              </Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercent}>
                {Math.round((verifiedCount / documents.length) * 100)}%
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Required Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          <Text style={styles.sectionSubtitle}>Complete these to start accepting jobs</Text>
          
          {requiredDocs.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={styles.documentCard}
              onPress={() => doc.status === 'pending' && showUploadOptions(doc.id, doc.name)}
              disabled={uploading === doc.id || doc.status === 'verified'}
            >
              <View style={[styles.docIcon, { backgroundColor: getStatusColor(doc.status) + '15' }]}>
                {uploading === doc.id ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Ionicons name={doc.icon as any} size={22} color={getStatusColor(doc.status)} />
                )}
              </View>
              <View style={styles.docInfo}>
                <View style={styles.docHeader}>
                  <Text style={styles.docName}>{doc.name}</Text>
                  <Text style={styles.requiredBadge}>Required</Text>
                </View>
                <Text style={styles.docDesc}>{doc.description}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(doc.status) + '15' }]}>
                <Ionicons name={getStatusIcon(doc.status) as any} size={14} color={getStatusColor(doc.status)} />
                <Text style={[styles.statusText, { color: getStatusColor(doc.status) }]}>
                  {getStatusText(doc.status)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Optional Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Optional Documents</Text>
          <Text style={styles.sectionSubtitle}>Boost your profile with additional verification</Text>
          
          {optionalDocs.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={styles.documentCard}
              onPress={() => doc.status === 'pending' && showUploadOptions(doc.id, doc.name)}
              disabled={uploading === doc.id || doc.status === 'verified'}
            >
              <View style={[styles.docIcon, { backgroundColor: getStatusColor(doc.status) + '15' }]}>
                {uploading === doc.id ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Ionicons name={doc.icon as any} size={22} color={getStatusColor(doc.status)} />
                )}
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docName}>{doc.name}</Text>
                <Text style={styles.docDesc}>{doc.description}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(doc.status) + '15' }]}>
                <Ionicons name={getStatusIcon(doc.status) as any} size={14} color={getStatusColor(doc.status)} />
                <Text style={[styles.statusText, { color: getStatusColor(doc.status) }]}>
                  {getStatusText(doc.status)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Documents are reviewed within 24-48 hours. You'll be notified once verified.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  progressCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  progressCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  docIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  docInfo: {
    flex: 1,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  docName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  requiredBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.error,
    backgroundColor: COLORS.error + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  docDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.primary + '10',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
});
