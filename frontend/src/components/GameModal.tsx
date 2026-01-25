import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  background: '#08080C',
  backgroundSecondary: '#0F0F14',
  cardBg: '#16161E',
  cardBorder: '#252530',
  primary: '#8B5CF6',
  cyan: '#06B6D4',
  green: '#34D399',
  amber: '#F59E0B',
  blue: '#3B82F6',
  magenta: '#D946EF',
  red: '#F87171',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
};

export type ModalType = 'success' | 'confirm' | 'info' | 'warning' | 'delivery';

interface GameModalProps {
  visible: boolean;
  type: ModalType;
  title: string;
  message: string;
  emoji?: string;
  xpReward?: number;
  coinsReward?: number;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
  onClose?: () => void;
}

const MODAL_CONFIGS = {
  success: {
    gradientColors: ['#059669', '#34D399', '#6EE7B7'] as const,
    iconName: 'checkmark-circle' as const,
    defaultEmoji: '🎉',
  },
  confirm: {
    gradientColors: ['#3B82F6', '#60A5FA', '#93C5FD'] as const,
    iconName: 'help-circle' as const,
    defaultEmoji: '🤔',
  },
  info: {
    gradientColors: ['#8B5CF6', '#A78BFA', '#C4B5FD'] as const,
    iconName: 'information-circle' as const,
    defaultEmoji: '✨',
  },
  warning: {
    gradientColors: ['#D97706', '#F59E0B', '#FBBF24'] as const,
    iconName: 'warning' as const,
    defaultEmoji: '⚠️',
  },
  delivery: {
    gradientColors: ['#06B6D4', '#22D3EE', '#67E8F9'] as const,
    iconName: 'cube' as const,
    defaultEmoji: '📦',
  },
};

export default function GameModal({
  visible,
  type,
  title,
  message,
  emoji,
  xpReward,
  coinsReward,
  primaryButtonText = 'OK',
  secondaryButtonText,
  onPrimaryPress,
  onSecondaryPress,
  onClose,
}: GameModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const config = MODAL_CONFIGS[type];
  const displayEmoji = emoji || config.defaultEmoji;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Bounce animation for emoji
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.15,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Confetti/sparkle effect
      if (type === 'success') {
        Animated.loop(
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        ).start();
      }
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handlePrimaryPress = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.8,
      duration: 150,
      useNativeDriver: true,
    }).start(() => onPrimaryPress());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Glowing Background Ring */}
          <View style={[styles.glowRing, { shadowColor: config.gradientColors[0] }]} />
          
          <View style={styles.modalContent}>
            {/* Header with Gradient */}
            <LinearGradient
              colors={config.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            >
              {/* Sparkles for success */}
              {type === 'success' && (
                <>
                  <Text style={[styles.sparkle, styles.sparkle1]}>✨</Text>
                  <Text style={[styles.sparkle, styles.sparkle2]}>⭐</Text>
                  <Text style={[styles.sparkle, styles.sparkle3]}>✨</Text>
                </>
              )}
              
              {/* Animated Emoji */}
              <Animated.View
                style={[
                  styles.emojiContainer,
                  { transform: [{ scale: bounceAnim }] },
                ]}
              >
                <Text style={styles.emoji}>{displayEmoji}</Text>
              </Animated.View>
            </LinearGradient>

            {/* Body */}
            <View style={styles.body}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              {/* Rewards Section */}
              {(xpReward || coinsReward) && (
                <View style={styles.rewardsContainer}>
                  {xpReward && (
                    <View style={styles.rewardBadge}>
                      <LinearGradient
                        colors={['#8B5CF6', '#A78BFA']}
                        style={styles.rewardGradient}
                      >
                        <Ionicons name="flash" size={14} color="#FFF" />
                        <Text style={styles.rewardText}>+{xpReward} XP</Text>
                      </LinearGradient>
                    </View>
                  )}
                  {coinsReward && (
                    <View style={styles.rewardBadge}>
                      <LinearGradient
                        colors={['#F59E0B', '#FBBF24']}
                        style={styles.rewardGradient}
                      >
                        <Text style={styles.coinEmoji}>💰</Text>
                        <Text style={styles.rewardText}>₹{coinsReward}</Text>
                      </LinearGradient>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {secondaryButtonText && onSecondaryPress && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={onSecondaryPress}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>{secondaryButtonText}</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.primaryButton, !secondaryButtonText && styles.primaryButtonFull]}
                onPress={handlePrimaryPress}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={config.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButtonGradient}
                >
                  <Text style={styles.primaryButtonText}>{primaryButtonText}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 360,
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 40,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  headerGradient: {
    paddingVertical: 32,
    alignItems: 'center',
    position: 'relative',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 20,
  },
  sparkle1: {
    top: 10,
    left: 30,
  },
  sparkle2: {
    top: 20,
    right: 40,
  },
  sparkle3: {
    bottom: 15,
    left: 50,
  },
  emojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emoji: {
    fontSize: 42,
  },
  body: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  rewardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  rewardBadge: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  rewardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  coinEmoji: {
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  primaryButtonFull: {
    flex: 1,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
