import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { copyToClipboard } from '../lib/clipboard';
import { GitCommit, ChevronDown, Copy, Check, Plus, Minus } from '../lib/icons';
import { Commit } from '../types';
import { colors, radius, spacing, fontSize } from '../lib/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Initials({ name }: { name: string }) {
  const parts = name.split(' ');
  const init = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  const hue = (name.charCodeAt(0) * 30) % 360;
  return (
    <View style={[styles.avatar, { backgroundColor: `hsl(${hue},50%,30%)` }]}>
      <Text style={styles.avatarText}>{init.toUpperCase()}</Text>
    </View>
  );
}

type Props = { commit: Commit };

export function CommitCard({ commit }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const rotate = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(rotate, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setExpanded((v) => !v);
  };

  const rotateInterpolate = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const copyHash = async () => {
    await copyToClipboard(commit.sha);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <TouchableOpacity style={styles.header} onPress={toggle} activeOpacity={0.8}>
        <GitCommit size={14} color={colors.accent} />
        <View style={styles.headerMeta}>
          <Text style={styles.message} numberOfLines={expanded ? undefined : 1}>
            {commit.message}
          </Text>
          <View style={styles.headerRow}>
            <Initials name={commit.author} />
            <Text style={styles.metaText}>{commit.author}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.metaText}>{relativeTime(commit.timestamp)}</Text>
            <Text style={styles.dot}>·</Text>
            <TouchableOpacity onPress={copyHash} style={styles.hash} hitSlop={6}>
              {copied ? <Check size={10} color={colors.successText} /> : <Copy size={10} color={colors.textMuted} />}
              <Text style={[styles.hashText, copied && { color: colors.successText }]}>
                {commit.shortSha}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <ChevronDown size={16} color={colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statChip}>
          <Plus size={10} color={colors.successText} />
          <Text style={[styles.statText, { color: colors.successText }]}>{commit.totalAdditions}</Text>
        </View>
        <View style={styles.statChip}>
          <Minus size={10} color={colors.dangerText} />
          <Text style={[styles.statText, { color: colors.dangerText }]}>{commit.totalDeletions}</Text>
        </View>
        <Text style={styles.fileCount}>{commit.files.length} file{commit.files.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Expanded file list */}
      {expanded && (
        <View style={styles.fileList}>
          {commit.files.map((f) => (
            <View key={f.filename} style={styles.fileRow}>
              <Text
                style={[
                  styles.fileStatus,
                  f.status === 'added' && { color: colors.successText },
                  f.status === 'deleted' && { color: colors.dangerText },
                  f.status === 'modified' && { color: colors.warningText },
                ]}
              >
                {f.status[0].toUpperCase()}
              </Text>
              <Text style={styles.filename} numberOfLines={1}>{f.filename}</Text>
              <Text style={[styles.statText, { color: colors.successText }]}>+{f.additions}</Text>
              <Text style={[styles.statText, { color: colors.dangerText }]}>-{f.deletions}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginVertical: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
  },
  headerMeta: { flex: 1, gap: 4 },
  message: { color: colors.text, fontSize: fontSize.md, fontWeight: '500', lineHeight: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  metaText: { color: colors.textMuted, fontSize: fontSize.sm },
  dot: { color: colors.textFaint, fontSize: fontSize.sm },
  hash: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  hashText: { color: colors.textMuted, fontSize: fontSize.sm, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  avatar: { width: 16, height: 16, borderRadius: radius.full, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 8, fontWeight: '700' },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  statText: { fontSize: fontSize.sm, fontWeight: '600' },
  fileCount: { color: colors.textMuted, fontSize: fontSize.sm, marginLeft: 4 },
  fileList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 6,
  },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fileStatus: { width: 12, fontSize: fontSize.sm, fontWeight: '700', textAlign: 'center' },
  filename: { flex: 1, color: colors.textMuted, fontSize: fontSize.sm, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});
