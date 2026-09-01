import React, { useState, useEffect } from 'react';
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
import {
  X,
  Search,
  Star,
  Film,
  Clapperboard,
  Sparkles,
  Send,
  Popcorn,
  Flame,
  Gem,
} from 'lucide-react-native';

import { storiesApi } from '@/api/stories';
import { moviesApi } from '@/api/movies';
import { useAuth } from '@/hooks/useAuth';
import type { Media } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { Avatar } from '@/components/avatar/Avatar';
import showToast from '@/lib/toast';

interface CreateStoryModalProps {
  visible: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
}

const STORY_TYPES = [
  { id: 'watching', label: 'Watching', icon: Popcorn, color: '#38BDF8' },
  { id: 'review', label: 'Rating', icon: Star, color: '#FBBF24' },
  { id: 'hot_take', label: 'Hot Take', icon: Flame, color: '#F43F5E' },
  { id: 'gem', label: 'Gem', icon: Gem, color: '#8B5CF6' },
  { id: 'mood', label: 'Vibe', icon: Sparkles, color: '#10B981' },
];

export function CreateStoryModal({
  visible,
  onClose,
  onStoryCreated,
}: CreateStoryModalProps) {
  const { user } = useAuth();

  const [storyType, setStoryType] = useState('watching');
  const [caption, setCaption] = useState('');
  const [rating, setRating] = useState(5);
  const [movieQuery, setMovieQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<Media | null>(null);
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
    if (!caption.trim() && !selectedMovie) {
      showToast.error('Please tag a film or add a caption');
      return;
    }

    setSubmitting(true);
    try {
      await storiesApi.create({
        movie_id: selectedMovie?.id,
        movie_title: selectedMovie?.title || selectedMovie?.name,
        movie_poster: selectedMovie?.poster_path,
        movie_backdrop: selectedMovie?.backdrop_path,
        media_type: selectedMovie?.media_type || 'movie',
        caption: caption.trim() || undefined,
        story_type: storyType,
        rating: storyType === 'review' ? rating : undefined,
      });

      showToast.success('Film Story posted! 🎬 (24h live)');
      onStoryCreated();
      onClose();
      // Reset
      setCaption('');
      setSelectedMovie(null);
      setMovieQuery('');
      setSearchResults([]);
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to post story');
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

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar
              src={user?.avatar_url}
              seed={user?.username || user?.name}
              name={user?.name}
              size={32}
              borderRadius={16}
            />
            <Text style={styles.headerTitle}>Share 24h Film Story</Text>
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
        >
          {/* Story Type Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeSelectorScroll}
          >
            {STORY_TYPES.map((st) => {
              const isActive = storyType === st.id;
              const Icon = st.icon;
              return (
                <IOSPressable
                  key={st.id}
                  style={[
                    styles.typeChip,
                    isActive && {
                      backgroundColor: `${st.color}25`,
                      borderColor: st.color,
                    },
                  ]}
                  onPress={() => setStoryType(st.id)}
                  activeScale={0.94}
                >
                  <Icon size={14} color={isActive ? st.color : '#9CA3AF'} />
                  <Text
                    style={[
                      styles.typeChipText,
                      isActive && { color: '#FFFFFF', fontFamily: fonts.bodySemi },
                    ]}
                  >
                    {st.label}
                  </Text>
                </IOSPressable>
              );
            })}
          </ScrollView>

          {/* Movie Tagging Search */}
          <View style={styles.movieSection}>
            <Text style={styles.sectionLabel}>TAG A MOVIE / SHOW</Text>
            {selectedMovie ? (
              <View style={styles.selectedMovieChip}>
                <Film size={14} color={colors.primary} />
                <Text style={styles.selectedMovieTitle} numberOfLines={1}>
                  {selectedMovie.title || selectedMovie.name}
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
                  placeholder="Search TMDB titles..."
                  placeholderTextColor={colors.textDim}
                />
                {searching && <ActivityIndicator size="small" color={colors.primary} />}
              </View>
            )}

            {/* Results Dropdown */}
            {searchResults.length > 0 && !selectedMovie && (
              <View style={styles.searchResultsDropdown}>
                {searchResults.map((m) => (
                  <IOSPressable
                    key={m.id}
                    style={styles.searchResultItem}
                    onPress={() => {
                      setSelectedMovie(m);
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

          {/* Rating for Reviews */}
          {storyType === 'review' && (
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

          {/* Caption Input */}
          <View style={styles.captionSection}>
            <Text style={styles.sectionLabel}>STORY CAPTION / MOMENT</Text>
            <TextInput
              style={styles.captionInput}
              value={caption}
              onChangeText={setCaption}
              placeholder="What are your immediate thoughts or emotions?"
              placeholderTextColor={colors.textDim}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
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
                <Text style={styles.publishBtnText}>Publish Film Story (24h)</Text>
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
    fontSize: 16,
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
  movieSection: {
    gap: 6,
  },
  sectionLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.secondaryLabel,
    letterSpacing: 0.8,
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
  starPickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  captionSection: {
    gap: 6,
  },
  captionInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radius.lg,
    padding: 14,
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#FFFFFF',
    minHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
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
  },
  publishBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
