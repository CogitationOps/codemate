import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  LayoutAnimation, Linking, Platform, UIManager,
} from 'react-native';
import { Link2, ExternalLink, ChevronDown } from '../lib/icons';
import { Source } from '../types';
import { colors, radius, spacing, fontSize } from '../lib/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = { sources: Source[] };

export function SourcesCollapsible({ sources }: Props) {
  const [open, setOpen] = useState(false);
  const rotate = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(rotate, { toValue: open ? 0 : 1, duration: 200, useNativeDriver: true }).start();
    setOpen((v) => !v);
  };

  const rotateStr = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.trigger} onPress={toggle} activeOpacity={0.8}>
        <Link2 size={13} color={colors.textMuted} />
        <Text style={styles.triggerText}>Used {sources.length} source{sources.length !== 1 ? 's' : ''}</Text>
        <Animated.View style={{ transform: [{ rotate: rotateStr }] }}>
          <ChevronDown size={13} color={colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>
      {open && (
        <View style={styles.list}>
          {sources.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={styles.sourceRow}
              onPress={() => Linking.openURL(s.url)}
              activeOpacity={0.7}
            >
              <View style={styles.sourceInner}>
                <Text style={styles.sourceTitle} numberOfLines={1}>{s.title}</Text>
                <Text style={styles.sourceUrl} numberOfLines={1}>{s.url}</Text>
              </View>
              <ExternalLink size={13} color={colors.accent} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
  },
  triggerText: { flex: 1, color: colors.textMuted, fontSize: fontSize.sm },
  list: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  sourceInner: { flex: 1 },
  sourceTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: '500' },
  sourceUrl: { color: colors.accent, fontSize: fontSize.xs, marginTop: 2 },
});
