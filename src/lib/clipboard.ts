/**
 * Clipboard utility — gracefully degrades in Expo Go where the
 * native ExpoClipboard module isn't bundled. In a custom dev-client
 * or production build, the real expo-clipboard module is used.
 */
let _setString: ((text: string) => Promise<void>) | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('expo-clipboard');
  if (mod?.setStringAsync) {
    _setString = (text: string) => mod.setStringAsync(text);
  }
} catch {
  // Expo Go: native module not available, copy silently no-ops
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await _setString?.(text);
  } catch {
    // silently ignore
  }
}
