import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Play, Film, ExternalLink, Bell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, fonts, radius, spacing } from '@/theme';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { moviesApi } from '@/api/movies';
import type { Video } from '@/types';
import showToast from '@/lib/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_WIDTH = Math.min(SCREEN_WIDTH - 24, 600);
const VIDEO_HEIGHT = Math.round((VIDEO_WIDTH * 9) / 16);

interface TrailerModalProps {
  visible: boolean;
  onClose: () => void;
  mediaTitle: string;
  mediaId?: number | string;
  mediaType?: 'movie' | 'tv';
  trailerKey?: string | null;
  trailerUrl?: string | null;
}

export function TrailerModal({
  visible,
  onClose,
  mediaTitle,
  mediaId,
  mediaType = 'movie',
  trailerKey: initialKey,
  trailerUrl: initialUrl,
}: TrailerModalProps) {
  const insets = useSafeAreaInsets();
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [resolvedKey, setResolvedKey] = useState<string | null>(initialKey ?? null);

  // Extract key from explicit initial URL or initialKey
  useEffect(() => {
    if (!visible) return;

    if (initialKey) {
      setResolvedKey(initialKey);
      setIsFetchingDetail(false);
      return;
    }

    if (initialUrl) {
      const match = initialUrl.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      );
      if (match) {
        setResolvedKey(match[1]);
        setIsFetchingDetail(false);
        return;
      }
    }

    // If no key provided, fetch movie details & custom-info
    if (mediaId) {
      setIsFetchingDetail(true);
      Promise.all([
        moviesApi.detail(mediaId, mediaType).catch(() => null),
        moviesApi.customInfo(mediaId).catch(() => null),
      ])
        .then(([detailData, customData]) => {
          // 1. Check custom override
          if (customData?.trailer_url) {
            const match = customData.trailer_url.match(
              /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
            );
            if (match) {
              setResolvedKey(match[1]);
              setIsFetchingDetail(false);
              return;
            }
          }

          // 2. Check TMDB videos array
          const vList: Video[] = detailData?.videos?.results || [];
          const best =
            vList.find(
              (v) =>
                v.type === 'Trailer' &&
                v.site === 'YouTube' &&
                (v.name.toLowerCase().includes('official') ||
                  v.name.toLowerCase().includes('main') ||
                  v.name.toLowerCase().includes('trailer'))
            ) ||
            vList.find((v) => v.type === 'Trailer' && v.site === 'YouTube') ||
            vList.find(
              (v) =>
                (v.type === 'Trailer' ||
                  v.type === 'Teaser' ||
                  v.type === 'Clip' ||
                  v.type === 'Featurette') &&
                v.site === 'YouTube'
            ) ||
            vList.find((v) => v.site === 'YouTube' && !!v.key);

          if (best?.key) {
            setResolvedKey(best.key);
          } else {
            setResolvedKey(null);
          }
        })
        .catch(() => {
          setResolvedKey(null);
        })
        .finally(() => {
          setIsFetchingDetail(false);
        });
    } else {
      setResolvedKey(null);
      setIsFetchingDetail(false);
    }
  }, [visible, initialKey, initialUrl, mediaId, mediaType]);

  const handleOpenYouTube = () => {
    const url = resolvedKey
      ? `https://www.youtube.com/watch?v=${resolvedKey}`
      : `https://www.youtube.com/results?search_query=${encodeURIComponent(mediaTitle + ' official trailer')}`;
    Linking.openURL(url).catch(() => {
      showToast.info('Unable to open YouTube app');
    });
  };

  const handleNotifyMe = () => {
    showToast.success(`We will notify you when the trailer for ${mediaTitle} is out!`);
    onClose();
  };

  if (!visible) return null;

  // Build embed URL (direct key or smart fallback search query)
  const embedSourceUrl = resolvedKey
    ? `https://www.youtube-nocookie.com/embed/${resolvedKey}?autoplay=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`
    : `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(mediaTitle + ' trailer')}&autoplay=1&playsinline=1&rel=0&modestbranding=1`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Dark Obsidian Glass Backdrop */}
        <LinearGradient
          colors={['rgba(8, 8, 12, 0.96)', 'rgba(12, 10, 20, 0.98)', '#08080C']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Top Header Bar */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
          <View style={styles.headerInfo}>
            <View style={styles.titleRow}>
              <Film size={16} color={colors.primary} />
              <Text style={styles.mediaTitleText} numberOfLines={1}>
                {mediaTitle}
              </Text>
            </View>
            <Text style={styles.subTitleText}>
              {resolvedKey ? 'Official Trailer' : isFetchingDetail ? 'Loading Trailer…' : 'Trailer Stream'}
            </Text>
          </View>

          <IOSPressable
            style={styles.closeBtn}
            onPress={onClose}
            activeScale={0.88}
            accessibilityRole="button"
            accessibilityLabel="Close trailer"
          >
            <X size={20} color="#FFFFFF" strokeWidth={2.4} />
          </IOSPressable>
        </View>

        {/* Main Content Area */}
        <View style={styles.contentContainer}>
          {isFetchingDetail ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.centerLoadingText}>Fetching official trailer…</Text>
            </View>
          ) : (
            <View style={styles.playerContainer}>
              <View style={[styles.videoWrapper, { width: VIDEO_WIDTH, height: VIDEO_HEIGHT }]}>
                <WebView
                  source={{
                    html: `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
                          <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; background: #000; }
                            html, body { width: 100%; height: 100%; overflow: hidden; display: flex; align-items: center; justify-content: center; }
                            iframe { width: 100%; height: 100%; border: none; }
                          </style>
                        </head>
                        <body>
                          <iframe
                            src="${embedSourceUrl}"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowfullscreen
                          ></iframe>
                        </body>
                      </html>
                    `,
                  }}
                  style={styles.webview}
                  javaScriptEnabled
                  domStorageEnabled
                  allowsInlineMediaPlayback
                  mediaPlaybackRequiresUserAction={false}
                  onLoadEnd={() => setIsLoadingVideo(false)}
                />

                {isLoadingVideo && (
                  <View style={styles.videoLoading}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.videoLoadingText}>Buffering trailer…</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons Below Video */}
              <View style={styles.playerActionsRow}>
                <IOSPressable
                  style={styles.youtubeLinkBtn}
                  onPress={handleOpenYouTube}
                  activeScale={0.94}
                  accessibilityRole="button"
                  accessibilityLabel="Watch in YouTube App"
                >
                  <ExternalLink size={14} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.youtubeLinkText}>Watch on YouTube</Text>
                </IOSPressable>

                <IOSPressable
                  style={styles.doneBtn}
                  onPress={onClose}
                  activeScale={0.94}
                  accessibilityRole="button"
                  accessibilityLabel="Done"
                >
                  <Text style={styles.doneBtnText}>Close</Text>
                </IOSPressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  mediaTitleText: {
    fontFamily: fonts.headingBlack,
    fontSize: 17,
    color: '#FFFFFF',
    flexShrink: 1,
  },
  subTitleText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  centerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  centerLoadingText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  playerContainer: {
    alignItems: 'center',
    gap: 16,
  },
  videoWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0E',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  videoLoadingText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.primary,
  },
  playerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  youtubeLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  youtubeLinkText: {
    fontFamily: fonts.headingSemi,
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  doneBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  doneBtnText: {
    fontFamily: fonts.headingBlack,
    fontSize: 12.5,
    color: '#FFFFFF',
  },
});
