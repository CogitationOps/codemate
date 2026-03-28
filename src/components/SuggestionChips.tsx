import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Zap } from '../lib/icons';
import { colors, radius, spacing, fontSize } from '../lib/theme';

const DEFAULT_SUGGESTIONS = [
  'Scan last 5 commits',
  'Scan last 10 commits',
  'Analyze latest commit',
  'Show open findings',
  'Help',
];

type Props = {
  onSelect: (prompt: string) => void;
  suggestions?: string[];
};

export function SuggestionChips({ onSelect, suggestions = DEFAULT_SUGGESTIONS }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {suggestions.map((s) => (
        <TouchableOpacity
          key={s}
          style={styles.chip}
          onPress={() => onSelect(s)}
          activeOpacity={0.7}
        >
          <Zap size={12} color={colors.accent} />
          <Text style={styles.label}>{s}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentDim,
  },
  label: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
});
