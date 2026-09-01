import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  Dices,
  Palette,
  Check,
  Camera,
  RefreshCw,
  Sparkles,
  Link2,
} from 'lucide-react-native';

import { authApi } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';
import { colors, fonts, radius, spacing } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { IOSSegmentedControl } from '@/components/ios/IOSSegmentedControl';
import { Avatar, getAvatarUrl } from './Avatar';
import showToast from '@/lib/toast';

interface AvatarModalProps {
  visible: boolean;
  onClose: () => void;
  onAvatarUpdated?: (newUrl: string) => void;
}

const STYLE_OPTIONS = [
  { id: 'lorelei', name: 'Lorelei' },
  { id: 'avataaars', name: 'Avataaars' },
  { id: 'bottts', name: 'Bottts' },
  { id: 'personas', name: 'Personas' },
  { id: 'notionists', name: 'Notionist' },
  { id: 'micah', name: 'Micah' },
  { id: 'pixelArt', name: 'Pixel Art' },
  { id: 'adventurer', name: 'Adventurer' },
  { id: 'bigSmile', name: 'Big Smile' },
  { id: 'funEmoji', name: 'Fun Emoji' },
  { id: 'thumbs', name: 'Thumbs' },
  { id: 'openPeeps', name: 'Peeps' },
];

const COLOR_PALETTES = [
  { name: 'Dark Void', hex: '121216', color: '#121216' },
  { name: 'Crimson', hex: 'e50914', color: '#E50914' },
  { name: 'Violet', hex: '8b5cf6', color: '#8B5CF6' },
  { name: 'Cyan', hex: '06b6d4', color: '#06B6D4' },
  { name: 'Amber', hex: 'f59e0b', color: '#F59E0B' },
  { name: 'Emerald', hex: '10b981', color: '#10B981' },
  { name: 'Rose', hex: 'f43f5e', color: '#F43F5E' },
  { name: 'White', hex: 'ffffff', color: '#FFFFFF' },
];

const RANDOM_SEEDS = [
  'BladeRunner',
  'NeoMatrix',
  'CinemaBuff',
  'Interstellar',
  'Oppenheimer',
  'Godfather',
  'PulpFiction',
  'Dune',
  'Kubrick',
  'SpiritedAway',
  'Whiplash',
  'LaLaLand',
  'Amelie',
  'Tarantino',
];

export function AvatarModal({ visible, onClose, onAvatarUpdated }: AvatarModalProps) {
  const { user, updateUser } = useAuth();

  const [mode, setMode] = useState<'dicebear' | 'custom'>('dicebear');
  const [styleName, setStyleName] = useState('lorelei');
  const [seed, setSeed] = useState(user?.username || user?.name || 'Cinephile');
  const [selectedColor, setSelectedColor] = useState('121216');
  const [customPhotoUrl, setCustomPhotoUrl] = useState(user?.avatar_url || '');
  const [saving, setSaving] = useState(false);

  const previewUrl = useMemo(() => {
    if (mode === 'custom' && customPhotoUrl.trim()) {
      return customPhotoUrl.trim();
    }
    return getAvatarUrl(null, seed, user?.name, styleName, selectedColor);
  }, [mode, customPhotoUrl, seed, user?.name, styleName, selectedColor]);

  const handleRollDice = () => {
    const random =
      RANDOM_SEEDS[Math.floor(Math.random() * RANDOM_SEEDS.length)] +
      '_' +
      Math.floor(Math.random() * 900 + 100);
    setSeed(random);
  };

  const handleSaveAvatar = async () => {
    if (!user) return;
    setSaving(true);
    const finalUrl = previewUrl;

    try {
      const updated = await authApi.updateProfile({
        avatar_url: finalUrl,
      });
      await updateUser(updated);
      onAvatarUpdated?.(finalUrl);
      showToast.success('Avatar updated successfully! ✨');
      onClose();
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to update avatar');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        avatar_url: '',
      });
      await updateUser(updated);
      onAvatarUpdated?.('');
      setCustomPhotoUrl('');
      showToast.info('Avatar reset to default');
      onClose();
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to reset avatar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.handle} />
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Avatar Studio</Text>
            <Text style={styles.headerSub}>Personalize your cinephile icon</Text>
          </View>
          <IOSPressable
            style={styles.closeBtn}
            onPress={onClose}
            activeScale={0.9}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={18} color={colors.textMuted} />
          </IOSPressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={true}
        >
          {/* Avatar Preview Spotlight */}
          <View style={styles.spotlight}>
            <View style={styles.avatarGlow}>
              <Avatar
                src={previewUrl}
                name={user?.name}
                size={120}
                borderRadius={60}
              />
            </View>

            {mode === 'dicebear' && (
              <IOSPressable
                style={styles.rollBtn}
                onPress={handleRollDice}
                activeScale={0.93}
                accessibilityRole="button"
                accessibilityLabel="Roll random avatar"
              >
                <Dices size={16} color="#FFFFFF" />
                <Text style={styles.rollBtnText}>Roll Random</Text>
              </IOSPressable>
            )}
          </View>

          {/* Mode Switcher */}
          <View style={styles.segmentedWrap}>
            <IOSSegmentedControl<'dicebear' | 'custom'>
              segments={[
                { id: 'dicebear', label: '🎨 Generator' },
                { id: 'custom', label: '🔗 Image Link' },
              ]}
              selectedId={mode}
              onSelect={setMode}
            />
          </View>

          {mode === 'dicebear' ? (
            <>
              {/* Style Selector */}
              <Text style={styles.sectionLabel}>AVATAR STYLE</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stylesScroll}
              >
                {STYLE_OPTIONS.map((style) => {
                  const isSelected = styleName === style.id;
                  return (
                    <IOSPressable
                      key={style.id}
                      style={[
                        styles.styleChip,
                        isSelected && styles.styleChipActive,
                      ]}
                      onPress={() => setStyleName(style.id)}
                      activeScale={0.94}
                      accessibilityRole="button"
                      accessibilityLabel={style.name}
                    >
                      <Text
                        style={[
                          styles.styleChipText,
                          isSelected && styles.styleChipTextActive,
                        ]}
                      >
                        {style.name}
                      </Text>
                    </IOSPressable>
                  );
                })}
              </ScrollView>

              {/* Color Palette */}
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>
                BACKGROUND COLOR
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colorScroll}
              >
                {COLOR_PALETTES.map((palette) => {
                  const isSelected = selectedColor === palette.hex;
                  return (
                    <IOSPressable
                      key={palette.hex}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: palette.color },
                        isSelected && styles.colorCircleActive,
                      ]}
                      onPress={() => setSelectedColor(palette.hex)}
                      activeScale={0.9}
                      accessibilityRole="button"
                      accessibilityLabel={palette.name}
                    >
                      {isSelected && (
                        <Check
                          size={14}
                          color={palette.hex === 'ffffff' ? '#000' : '#fff'}
                          strokeWidth={3}
                        />
                      )}
                    </IOSPressable>
                  );
                })}
              </ScrollView>

              {/* Seed Editor Input */}
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>
                AVATAR SEED (TEXT / KEY)
              </Text>
              <View style={styles.inputBox}>
                <Sparkles size={16} color={colors.textDim} />
                <TextInput
                  style={styles.textInput}
                  value={seed}
                  onChangeText={setSeed}
                  placeholder="Enter custom seed keyword..."
                  placeholderTextColor={colors.textDim}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </>
          ) : (
            <>
              {/* Custom Image URL */}
              <Text style={styles.sectionLabel}>DIRECT IMAGE URL</Text>
              <View style={styles.inputBox}>
                <Link2 size={16} color={colors.textDim} />
                <TextInput
                  style={styles.textInput}
                  value={customPhotoUrl}
                  onChangeText={setCustomPhotoUrl}
                  placeholder="https://example.com/avatar.jpg"
                  placeholderTextColor={colors.textDim}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>
              <Text style={styles.inputHint}>
                Paste any publicly accessible PNG, JPG, or WebP profile image URL.
              </Text>
            </>
          )}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <IOSPressable
              style={styles.saveBtn}
              onPress={handleSaveAvatar}
              activeScale={0.96}
              accessibilityRole="button"
              accessibilityLabel="Save Avatar"
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save Avatar</Text>
              )}
            </IOSPressable>

            {user?.avatar_url ? (
              <IOSPressable
                style={styles.resetBtn}
                onPress={handleReset}
                activeScale={0.96}
                accessibilityRole="button"
                accessibilityLabel="Reset to default"
              >
                <Text style={styles.resetBtnText}>Reset to Default</Text>
              </IOSPressable>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F0F12',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: '#FFFFFF',
  },
  headerSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.secondaryLabel,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  spotlight: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarGlow: {
    padding: 6,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  rollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  rollBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: '#FFFFFF',
  },
  segmentedWrap: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.secondaryLabel,
    letterSpacing: 1,
    marginBottom: 10,
  },
  stylesScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  styleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
  },
  styleChipActive: {
    backgroundColor: 'rgba(229,9,20,0.18)',
    borderColor: 'rgba(229,9,20,0.5)',
  },
  styleChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: '#9CA3AF',
  },
  styleChipTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bodySemi,
  },
  colorScroll: {
    gap: 12,
    paddingBottom: 4,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleActive: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#FFFFFF',
    padding: 0,
  },
  inputHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textDim,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  actionRow: {
    marginTop: 28,
    gap: 10,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: '#FFFFFF',
  },
  resetBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  resetBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: '#9CA3AF',
  },
});
