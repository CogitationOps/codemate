/**
 * SimpleMarkdown — tiny RN-native markdown renderer.
 * Supports: **bold**, `code`, _italic_, newlines. No external deps.
 */
import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import { colors, fontSize } from '../lib/theme';

type Token =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'code'; value: string }
  | { type: 'newline' };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  // Split by bold (**), italic (_), code (`) or newline
  const re = /(\*\*(.+?)\*\*|`([^`]+)`|_(.+?)_|\n)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(input)) !== null) {
    if (match.index > last) {
      tokens.push({ type: 'text', value: input.slice(last, match.index) });
    }
    if (match[0] === '\n') {
      tokens.push({ type: 'newline' });
    } else if (match[1]?.startsWith('**')) {
      tokens.push({ type: 'bold', value: match[2] });
    } else if (match[1]?.startsWith('`')) {
      tokens.push({ type: 'code', value: match[3] });
    } else if (match[1]?.startsWith('_')) {
      tokens.push({ type: 'italic', value: match[4] });
    }
    last = match.index + match[0].length;
  }

  if (last < input.length) {
    tokens.push({ type: 'text', value: input.slice(last) });
  }
  return tokens;
}

type Props = { children: string; style?: object };

export function SimpleMarkdown({ children, style }: Props) {
  const tokens = tokenize(children ?? '');

  return (
    <Text style={[styles.base, style]}>
      {tokens.map((tok, i) => {
        switch (tok.type) {
          case 'bold':
            return <Text key={i} style={styles.bold}>{tok.value}</Text>;
          case 'italic':
            return <Text key={i} style={styles.italic}>{tok.value}</Text>;
          case 'code':
            return <Text key={i} style={styles.code}>{tok.value}</Text>;
          case 'newline':
            return <Text key={i}>{'\n'}</Text>;
          default:
            return <Text key={i}>{tok.value}</Text>;
        }
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
    fontSize: fontSize.base,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: colors.text,
  },
  italic: {
    fontStyle: 'italic',
    color: colors.text,
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: fontSize.sm,
    color: colors.accent,
    backgroundColor: colors.surface2,
  },
});
