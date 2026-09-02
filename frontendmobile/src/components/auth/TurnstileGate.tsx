import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { ShieldCheck } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { env } from '@/config/env';
import { colors, radius, spacing } from '@/theme';

/**
 * Cloudflare Turnstile for React Native.
 *
 * Turnstile has no native SDK — it only runs in a browser — so the widget is
 * hosted in a tiny inline HTML document inside a WebView, which posts the token
 * back over `postMessage`. This is the same flow the web app performs inline,
 * and the backend cannot tell the difference: `validate_turnstile` verifies the
 * token against Cloudflare either way, so no backend change is required.
 *
 * `originWhitelist` and the `source.baseUrl` matter: Turnstile validates the
 * requesting origin against the site key's allowed domains, so the document is
 * served under the same host the web app uses rather than `about:blank`.
 */

/** Widget height at `size: normal`, plus a little slack for the error row. */
const WIDGET_HEIGHT = 74;

export type TurnstileStatus = 'loading' | 'ready' | 'verified' | 'error' | 'expired';

interface Props {
  /** Fires with the token once Cloudflare completes the challenge. */
  onVerify: (token: string) => void;
  /** Fires when the token is cleared (error or expiry) so the form can disable submit. */
  onInvalidate: () => void;
  /**
   * Increment to force a fresh challenge.
   *
   * Turnstile tokens are single-use: once a login attempt consumes one, the
   * server will reject it a second time. But the widget keeps showing
   * "Success!" and never fires its callback again, so without this the submit
   * button would stay disabled forever after one failed attempt.
   */
  resetSignal?: number;
}

function buildHtml(siteKey: string): string {
  // `cf-turnstile-response` is posted straight through; nothing else in this
  // document talks to the app, and the WebView has no access to app state.
  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>
    <style>
      html, body {
        margin: 0; padding: 0; background: transparent;
        display: flex; align-items: center; justify-content: center;
        height: ${WIDGET_HEIGHT}px; overflow: hidden;
      }
    </style>
  </head>
  <body>
    <div id="widget"></div>
    <script>
      function post(payload) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
      window.onload = function () {
        var tries = 0;
        (function render() {
          if (window.turnstile) {
            try {
              window.turnstile.render('#widget', {
                sitekey: ${JSON.stringify(siteKey)},
                theme: 'dark',
                size: 'normal',
                callback: function (token) { post({ status: 'verified', token: token }); },
                'error-callback': function () { post({ status: 'error' }); },
                'expired-callback': function () { post({ status: 'expired' }); },
              });
              post({ status: 'ready' });
            } catch (e) {
              post({ status: 'error' });
            }
          } else if (tries++ > 50) {
            post({ status: 'error' });
          } else {
            setTimeout(render, 100);
          }
        })();
      };
    </script>
  </body>
</html>`;
}

export function TurnstileGate({ onVerify, onInvalidate, resetSignal = 0 }: Props) {
  const [status, setStatus] = useState<TurnstileStatus>('loading');
  const [bypassed, setBypassed] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const html = useMemo(() => buildHtml(env.turnstileSiteKey), []);

  // Re-run the challenge whenever the parent bumps `resetSignal`. Skipped on
  // first render — the widget renders its own challenge on load.
  const lastReset = useRef(resetSignal);
  useEffect(() => {
    if (resetSignal === lastReset.current) return;
    lastReset.current = resetSignal;
    setStatus('loading');
    webViewRef.current?.injectJavaScript(
      'if (window.turnstile) { window.turnstile.reset(); } true;'
    );
  }, [resetSignal]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let payload: { status?: string; token?: string };
      try {
        payload = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }

      switch (payload.status) {
        case 'ready':
          setStatus('ready');
          break;
        case 'verified':
          if (payload.token) {
            setStatus('verified');
            onVerify(payload.token);
          }
          break;
        case 'expired':
          setStatus('expired');
          onInvalidate();
          break;
        default:
          setStatus('error');
          onInvalidate();
      }
    },
    [onVerify, onInvalidate]
  );

  /**
   * Mirrors the web widget's escape hatch. `PASSTHROUGH_FALLBACK` is one of
   * three literals `backend/auth/router.py` accepts without contacting
   * Cloudflare, so users behind a blocked or unreachable challenge can still
   * sign in. Kept for parity with the web app — see the note in
   * MIGRATION_STATUS.md, this weakens the captcha on both clients.
   */
  const handleBypass = useCallback(() => {
    setBypassed(true);
    setStatus('verified');
    onVerify('PASSTHROUGH_FALLBACK');
  }, [onVerify]);

  if (bypassed) {
    return (
      <View style={styles.notice}>
        <ShieldCheck size={15} color={colors.success} />
        <Text variant="caption" color={colors.success}>
          Security verification bypassed
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html, baseUrl: env.turnstileHost }}
        originWhitelist={['*']}
        onMessage={handleMessage}
        onError={() => {
          setStatus('error');
          onInvalidate();
        }}
        // The document is a fixed height and must never scroll or bounce.
        scrollEnabled={false}
        bounces={false}
        // Without this the WebView paints a white block on a dark form.
        style={styles.webview}
        containerStyle={styles.webviewContainer}
        javaScriptEnabled
        domStorageEnabled
      />

      {status === 'loading' ? (
        <View style={[styles.overlay, { pointerEvents: 'none' }]}>
          <ActivityIndicator size="small" color={colors.textMuted} />
          <Text variant="caption">Verifying security…</Text>
        </View>
      ) : null}

      {status === 'error' ? (
        <Pressable onPress={handleBypass} hitSlop={8} style={styles.bypass}>
          <Text variant="caption" color={colors.warning}>
            Verification blocked or unavailable? Tap to continue
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: WIDGET_HEIGHT,
    justifyContent: 'center',
  },
  webview: {
    height: WIDGET_HEIGHT,
    backgroundColor: colors.transparent,
  },
  webviewContainer: {
    height: WIDGET_HEIGHT,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bypass: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: WIDGET_HEIGHT,
  },
});
