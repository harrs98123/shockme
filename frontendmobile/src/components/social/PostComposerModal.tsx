import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  Clapperboard,
  Eye,
  ThumbsUp,
  BarChart2,
  Image as ImageIcon,
  PlaySquare,
  Bookmark,
  Search,
  Star,
  Film,
  Sparkles,
  Send,
  AlertTriangle,
} from 'lucide-react-native';

import { socialApi } from '@/api/social';
import { moviesApi } from '@/api/movies';
import { useAuth } from '@/hooks/useAuth';
import type { Media } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { Avatar } from '@/components/avatar/Avatar';
import showToast from '@/lib/toast';

interface PostComposerModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

const POST_TYPES = [
  { id: 'review', label: 'Review', icon: ThumbsUp, color: '#C084FC' },
  { id: 'watching', label: 'Watching', icon: Eye, color: '#38BDF8' },
  { id: 'recommendation', label: 'Recommend', icon: Clapperboard, color: '#F43F5E' },
  { id: 'poll', label: 'Poll', icon: BarChart2, color: '#FBBF24' },
  { id: 'meme', label: 'Meme/Photo', icon: ImageIcon, color: '#A3E635' },
  { id: 'scene', label: 'Scene', icon: PlaySquare, color: '#F472B6' },
  { id: 'watchlist', label: 'Watchlist', icon: Bookmark, color: '#818CF8' },
];

export function PostComposerModal({
  visible,
  onClose,
  onPostCreated,
}: PostComposerModalProps) {
  const { user } = useAuth();

  const [activeType, setActiveType] = useState('review');
  const [content, setContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [rating, setRating] = useState(5);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [mediaUrl, setMediaUrl] = useState('');

  // Movie Search autocomplete
  const [movieQuery, setMovieQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [searchResults, setSearchResults] = useState<Media[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (movieQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await moviesApi.search(movieQuery.trim(), 1);
        setSearchResults((res.results || []).slice(0, 5));
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [movieQuery]);

  const handleSubmit = async () => {
    if (!content.trim() && activeType !== 'poll') {
      showToast.error('Please add some thoughts to your post');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {};
      if (activeType === 'review') payload.rating = rating;
      if (activeType === 'poll') {
        payload.options = pollOptions.filter((o) => o.trim().length > 0);
      }
      if (activeType === 'meme' || activeType === 'scene') {
        payload.media_url = mediaUrl.trim();
      }

      await socialApi.createPost({
        post_type: activeType,
        content: content.trim(),
        movie_id: selectedMovie?.id,
        is_spoiler: isSpoiler,
        payload: Object.keys(payload).length > 0 ? payload : undefined,
      });

      showToast.success('Hot take published! 🔥');
      onPostCreated();
      onClose();
      // Reset
      setContent('');
      setSelectedMovie(null);
      setMovieQuery('');
      setMediaUrl('');
      setIsSpoiler(false);
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to publish post');
    } finally {
      setSubmitting(false);
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
        <View style={styles.handle} />
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar
              src={user?.avatar_url}
              seed={user?.username || user?.name}
              name={user?.name}
              size={32}
              borderRadius={16}
            />
            <Text style={styles.headerTitle}>Create Hot Take</Text>
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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Post Type Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeSelectorScroll}
          >
            {POST_TYPES.map((pt) => {
              const isActive = activeType === pt.id;
              const Icon = pt.icon;
              return (
                <IOSPressable
                  key={pt.id}
                  style={[
                    styles.typeChip,
                    isActive && {
                      backgroundColor: `${pt.color}25`,
                      borderColor: pt.color,
                    },
                  ]}
                  onPress={() => setActiveType(pt.id)}
                  activeScale={0.94}
                >
                  <Icon size={14} color={isActive ? pt.color : '#9CA3AF'} />
                  <Text
                    style={[
                      styles.typeChipText,
                      isActive && { color: '#FFFFFF', fontFamily: fonts.bodySemi },
                    ]}
                  >
                    {pt.label}
                  </Text>
                </IOSPressable>
              );
            })}
          </ScrollView>

          {/* Tagged Movie Selector */}
          <View style={styles.movieSearchSection}>
            {selectedMovie ? (
              <View style={styles.selectedMovieChip}>
                <Film size={14} color={colors.primary} />
                <Text style={styles.selectedMovieTitle} numberOfLines={1}>
                  {selectedMovie.title}
                </Text>
                <IOSPressable
                  onPress={() => {
                    setSelectedMovie(null);
                    setMovieQuery('');
                  }}
                  hitSlop={8}
                >
                  <X size={14} color={colors.textDim} />
                </IOSPressable>
              </View>
            ) : (
              <View style={styles.searchInputBox}>
                <Search size={14} color={colors.textDim} />
                <TextInput
                  style={styles.searchInput}
                  value={movieQuery}
                  onChangeText={setMovieQuery}
                  placeholder="Tag a movie or show..."
                  placeholderTextColor={colors.textDim}
                />
                {searching && <ActivityIndicator size="small" color={colors.primary} />}
              </View>
            )}

            {/* Autocomplete Results */}
            {searchResults.length > 0 && !selectedMovie && (
              <View style={styles.searchResultsDropdown}>
                {searchResults.map((m) => (
                  <IOSPressable
                    key={m.id}
                    style={styles.searchResultItem}
                    onPress={() => {
                      setSelectedMovie({ id: m.id, title: m.title || m.name || '' });
                      setSearchResults([]);
                    }}
                  >
                    <Film size={12} color={colors.textMuted} />
                    <Text style={styles.searchResultTitle} numberOfLines={1}>
                      {m.title || m.name} ({(m.release_date || m.first_air_date)?.slice(0, 4)})
                    </Text>
                  </IOSPressable>
                ))}
              </View>
            )}
          </View>

          {/* Star Rating for Reviews */}
          {activeType === 'review' && (
            <View style={styles.ratingSection}>
              <Text style={styles.sectionLabel}>YOUR RATING</Text>
              <View style={styles.starPickerRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <IOSPressable
                    key={s}
                    onPress={() => setRating(s)}
                    activeScale={0.88}
                  >
                    <Star
                      size={28}
                      color="#FFC107"
                      fill={s <= rating ? '#FFC107' : 'none'}
                    />
                  </IOSPressable>
                ))}
              </View>
            </View>
          )}

          {/* Main Text Content Input */}
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="Share your thoughts, review, or hot take with the community..."
            placeholderTextColor={colors.textDim}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {/* Poll Options */}
          {activeType === 'poll' && (
            <View style={styles.pollSection}>
              <Text style={styles.sectionLabel}>POLL OPTIONS</Text>
              {pollOptions.map((opt, i) => (
                <TextInput
                  key={i}
                  style={styles.pollInput}
                  value={opt}
                  onChangeText={(val) => {
                    const next = [...pollOptions];
                    next[i] = val;
                    setPollOptions(next);
                  }}
                  placeholder={`Option ${i + 1}`}
                  placeholderTextColor={colors.textDim}
                />
              ))}
            </View>
          )}

          {/* Meme / Image URL */}
          {(activeType === 'meme' || activeType === 'scene') && (
            <View style={styles.mediaInputSection}>
              <Text style={styles.sectionLabel}>IMAGE / MEDIA URL</Text>
              <TextInput
                style={styles.pollInput}
                value={mediaUrl}
                onChangeText={setMediaUrl}
                placeholder="https://example.com/meme.jpg"
                placeholderTextColor={colors.textDim}
                keyboardType="url"
              />
            </View>
          )}

          {/* Spoiler Warning Switch */}
          <View style={styles.spoilerRow}>
            <View style={styles.spoilerTextGroup}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={14} color="#EF4444" />
                <Text style={styles.spoilerLabel}>Contains Spoilers</Text>
              </View>
              <Text style={styles.spoilerDesc}>
                Blur content until viewers tap to reveal
              </Text>
            </View>
            <Switch
              value={isSpoiler}
              onValueChange={setIsSpoiler}
              trackColor={{ false: '#222', true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Submit Button */}
          <IOSPressable
            style={styles.publishBtn}
            onPress={handleSubmit}
            disabled={submitting}
            activeScale={0.96}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Send size={15} color="#FFFFFF" />
                <Text style={styles.publishBtnText}>Publish Post</Text>
              </>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: 17,
    color: '#FFFFFF',
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
    gap: 16,
  },
  typeSelectorScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  typeChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
  },
  movieSearchSection: {
    position: 'relative',
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#FFFFFF',
    padding: 0,
  },
  selectedMovieChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(229,9,20,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(229,9,20,0.3)',
  },
  selectedMovieTitle: {
    flex: 1,
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  searchResultsDropdown: {
    backgroundColor: '#18181D',
    borderRadius: radius.md,
    padding: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 4,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  searchResultTitle: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#FFFFFF',
  },
  ratingSection: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.secondaryLabel,
    letterSpacing: 0.8,
  },
  starPickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contentInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radius.lg,
    padding: 14,
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#FFFFFF',
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  pollSection: {
    gap: 8,
  },
  pollInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mediaInputSection: {
    gap: 8,
  },
  spoilerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: radius.md,
  },
  spoilerTextGroup: {
    gap: 2,
  },
  spoilerLabel: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  spoilerDesc: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.secondaryLabel,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.lg,
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  publishBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
