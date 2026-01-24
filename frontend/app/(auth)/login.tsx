import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../src/store';
import * as api from '../../src/api';

const COLORS = {
  primary: '#7C3AED',
  primaryLight: '#E8D9F4',
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#212529',
  textSecondary: '#6C757D',
  border: '#E0E0E0',
  success: '#22C55E',
  error: '#EF4444',
};

export default function LoginScreen() {
  const router = useRouter();
  const { setUser, setSessionToken } = useAuthStore();
  
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const otpInputs = useRef<(TextInput | null)[]>([]);

  const handleSendOTP = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await api.sendOTP(cleanPhone);
      setStep('otp');
      // Focus first OTP input
      setTimeout(() => otpInputs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpInputs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      if (value && index < 5) {
        otpInputs.current[index + 1]?.focus();
      }
    }
  };

  const handleOTPKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    setError('');
    setIsLoading(true);

    try {
      const response = await api.verifyOTP(cleanPhone, otpValue);
      const { user, session_token, needs_profile } = response.data;
      
      // Store session token
      await AsyncStorage.setItem('session_token', session_token);
      setSessionToken(session_token);
      setUser(user);

      // Navigate based on profile status
      if (needs_profile) {
        router.replace('/register');
      } else {
        router.replace('/(main)/home');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      otpInputs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtp(['', '', '', '', '', '']);
    setError('');
    setIsLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      await api.sendOTP(cleanPhone);
      Alert.alert('OTP Sent', 'A new OTP has been sent to your phone');
      otpInputs.current[0]?.focus();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp(['', '', '', '', '', '']);
    setError('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo and Branding */}
          <View style={styles.brandingContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="sparkles" size={40} color={COLORS.white} />
            </View>
            <Text style={styles.appName}>Quickwish</Text>
            <Text style={styles.appSubtitle}>Genie</Text>
          </View>

          {step === 'phone' ? (
            /* Phone Number Input */
            <View style={styles.formContainer}>
              <Text style={styles.title}>Enter your mobile number</Text>
              <Text style={styles.subtitle}>
                We'll send you a verification code
              </Text>

              <View style={styles.phoneInputContainer}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={COLORS.textSecondary}
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text.replace(/\D/g, '').slice(0, 10));
                    setError('');
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus
                />
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Send OTP</Text>
                    <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.termsText}>
                By continuing, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          ) : (
            /* OTP Verification */
            <View style={styles.formContainer}>
              <TouchableOpacity style={styles.backButton} onPress={handleBackToPhone}>
                <Ionicons name="arrow-back" size={24} color={COLORS.text} />
              </TouchableOpacity>

              <Text style={styles.title}>Verify your number</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to{'\n'}
                <Text style={styles.phoneHighlight}>+91 {phone}</Text>
              </Text>

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (otpInputs.current[index] = ref)}
                    style={[
                      styles.otpInput,
                      digit && styles.otpInputFilled,
                      error && styles.otpInputError,
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOTPChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleOTPKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Verify & Continue</Text>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendOTP}
                disabled={isLoading}
              >
                <Text style={styles.resendText}>Didn't receive code? </Text>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>

              {/* Mock OTP Hint for Testing */}
              <View style={styles.mockHint}>
                <Ionicons name="information-circle" size={16} color={COLORS.textSecondary} />
                <Text style={styles.mockHintText}>Test OTP: 123456</Text>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  brandingContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -1,
  },
  appSubtitle: {
    fontSize: 24,
    fontWeight: '500',
    color: COLORS.primary,
    marginTop: -4,
  },
  formContainer: {
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 32,
    lineHeight: 22,
  },
  phoneHighlight: {
    fontWeight: '600',
    color: COLORS.text,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  countryCode: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginRight: 12,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.text,
    letterSpacing: 1,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpInput: {
    width: 50,
    height: 56,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  otpInputError: {
    borderColor: COLORS.error,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  termsText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  resendButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  mockHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  mockHintText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
