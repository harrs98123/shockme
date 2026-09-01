import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, User as UserIcon, AtSign, AlignLeft, Camera } from 'lucide-react-native';

import { authApi } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';
import { colors, fonts, radius, spacing } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { Avatar } from '@/components/avatar/Avatar';
import showToast from '@/lib/toast';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenAvatarStudio: () => void;
}

export function ProfileEditModal({
  visible,
  onClose,
  onOpenAvatarStudio,
}: ProfileEditModalProps) {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast.error('Name cannot be empty');
      return;
    }
    if (!username.trim()) {
      showToast.error('Username cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        name: name.trim(),
        username: username.trim(),
        bio: bio.trim(),
      });
      await updateUser(updated);
      showToast.success('Profile updated successfully! ✨');
      onClose();
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to update profile');
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
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Handle & Header */}
        <View style={styles.handle} />
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <Text style={styles.headerSub}>Update your identity and bio</Text>
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
          {/* Avatar Tap-to-Edit */}
          <View style={styles.avatarSection}>
            <IOSPressable
              style={styles.avatarWrap}
              onPress={() => {
                onClose();
                onOpenAvatarStudio();
              }}
              activeScale={0.95}
              accessibilityRole="button"
              accessibilityLabel="Change avatar"
            >
              <Avatar
                src={user?.avatar_url}
                seed={user?.username || user?.name}
                name={name || user?.name}
                size={96}
                borderRadius={48}
              />
              <View style={styles.cameraPill}>
                <Camera size={13} color="#FFFFFF" strokeWidth={2.4} />
              </View>
            </IOSPressable>
            <Text style={styles.avatarHint}>Tap avatar to open Studio</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Display Name */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <UserIcon
                  size={14}
                  color={focusedField === 'name' ? colors.primary : colors.textDim}
                />
                <Text style={styles.fieldLabel}>DISPLAY NAME</Text>
              </View>
              <View
                style={[
                  styles.inputWrap,
                  focusedField === 'name' && styles.inputWrapFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your full name"
                  placeholderTextColor={colors.textDim}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Username */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <AtSign
                  size={14}
                  color={focusedField === 'username' ? colors.primary : colors.textDim}
                />
                <Text style={styles.fieldLabel}>USERNAME</Text>
              </View>
              <View
                style={[
                  styles.inputWrap,
                  focusedField === 'username' && styles.inputWrapFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="username"
                  placeholderTextColor={colors.textDim}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Bio */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <AlignLeft
                  size={14}
                  color={focusedField === 'bio' ? colors.primary : colors.textDim}
                />
                <Text style={styles.fieldLabel}>BIO</Text>
              </View>
              <View
                style={[
                  styles.inputWrap,
                  styles.textAreaWrap,
                  focusedField === 'bio' && styles.inputWrapFocused,
                ]}
              >
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Cinematic storyteller, sci-fi enthusiast..."
                  placeholderTextColor={colors.textDim}
                  onFocus={() => setFocusedField('bio')}
                  onBlur={() => setFocusedField(null)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <IOSPressable
            style={styles.saveBtn}
            onPress={handleSubmit}
            activeScale={0.96}
            accessibilityRole="button"
            accessibilityLabel="Save Changes"
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </IOSPressable>
        </ScrollView>
      </KeyboardAvoidingView>
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
  avatarSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarWrap: {
    position: 'relative',
  },
  cameraPill: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F0F12',
  },
  avatarHint: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.secondaryLabel,
    marginTop: 8,
  },
  formSection: {
    gap: 16,
    marginVertical: 10,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 2,
  },
  fieldLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.secondaryLabel,
    letterSpacing: 0.8,
  },
  inputWrap: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 46,
    justifyContent: 'center',
  },
  inputWrapFocused: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(229,9,20,0.05)',
  },
  textAreaWrap: {
    minHeight: 96,
    paddingVertical: 12,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#FFFFFF',
    padding: 0,
  },
  textArea: {
    height: 80,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
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
});
