import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { copyToClipboard } from '../lib/clipboard';
import { Copy, Check } from '../lib/icons';
import { colors, radius, spacing, fontSize } from '../lib/theme';

// @ts-ignore – react-native-syntax-highlighter ships its own types
import SyntaxHighlighter from 'react-native-syntax-highlighter';
// @ts-ignore
import { atomOneDark } from 'react-syntax-highlighter/styles/hljs';

type Props = {
  code: string;
  language?: string;
};

export function CodeSnippet({ code, language = 'typescript' }: Props) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <Text style={styles.langLabel}>{language}</Text>
        <TouchableOpacity onPress={handleCopy} style={styles.copyBtn} activeOpacity={0.7}>
          {copied ? (
            <Check size={13} color={colors.successText} />
          ) : (
            <Copy size={13} color={colors.textMuted} />
          )}
          <Text style={[styles.copyText, copied && { color: colors.successText }]}>
            {copied ? 'Copied' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Code body */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <SyntaxHighlighter
          language={language}
          style={atomOneDark}
          customStyle={{
            margin: 0,
            padding: spacing.md,
            backgroundColor: 'transparent',
            fontSize: fontSize.sm,
            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
          }}
          codeTagProps={{ style: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' } }}
        >
          {code}
        </SyntaxHighlighter>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#0d1117',
    overflow: 'hidden',
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface2,
  },
  langLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '500',
    textTransform: 'lowercase',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
});
