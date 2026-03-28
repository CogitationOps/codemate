import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X, FileText, Image } from '../lib/icons';
import { Attachment } from '../types';
import { colors, radius, spacing, fontSize } from '../lib/theme';

type Props = {
  attachment: Attachment;
  onRemove?: () => void;
  variant?: 'inline' | 'grid' | 'list';
};

export function AttachmentChip({ attachment, onRemove, variant = 'inline' }: Props) {
  const isImage = attachment.mimeType.startsWith('image/');
  const Icon = isImage ? ImageIcon : FileText;

  if (variant === 'list') {
    return (
      <View style={styles.listRow}>
        <Icon size={14} color={colors.accent} />
        <Text style={styles.listName} numberOfLines={1}>{attachment.name}</Text>
        {onRemove && (
          <TouchableOpacity onPress={onRemove} style={styles.removeBtn} hitSlop={8}>
            <X size={12} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.chip, variant === 'grid' && styles.chipGrid]}>
      <Icon size={13} color={colors.accent} />
      <Text style={styles.chipName} numberOfLines={1}>{attachment.name}</Text>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn} hitSlop={8}>
          <X size={11} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    maxWidth: 180,
  },
  chipGrid: {
    borderRadius: radius.md,
    maxWidth: undefined,
  },
  chipName: {
    color: colors.text,
    fontSize: fontSize.sm,
    flex: 1,
  },
  removeBtn: {
    padding: 2,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  listName: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
  },
});
