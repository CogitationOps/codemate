import React, { useState, useRef } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Platform,
} from 'react-native';
import { Send, Paperclip, X } from '../lib/icons';
import { Attachment } from '../types';
import { colors, radius, spacing } from '../lib/theme';
import { AttachmentChip } from './AttachmentChip';

type Props = {
  onSend: (text: string, attachments?: Attachment[]) => void;
  disabled?: boolean;
};

const uid = () => Math.random().toString(36).slice(2);

export function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const inputRef = useRef<TextInput>(null);

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    onSend(text.trim(), attachments.length > 0 ? attachments : undefined);
    setText('');
    setAttachments([]);
  };

  const handleAttach = () => {
    // Native pickers require a dev-client rebuild with expo plugins.
    // Placeholder action for the MVP:
    Alert.alert('Attach File', 'In the full build, this opens the document/image picker.', [
      { text: 'Add Sample File', onPress: () => addSampleAttachment() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const addSampleAttachment = () => {
    setAttachments((prev) => [
      ...prev,
      { id: uid(), name: 'auth.ts', uri: 'file://auth.ts', mimeType: 'text/typescript', size: 2048 },
    ]);
  };

  const removeAttachment = (id: string) =>
    setAttachments((prev) => prev.filter((a) => a.id !== id));

  return (
    <View style={styles.outerContainer}>
      {/* Attachment chips */}
      {attachments.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.attachRow}
          keyboardShouldPersistTaps="always"
        >
          {attachments.map((a) => (
            <AttachmentChip key={a.id} attachment={a} onRemove={() => removeAttachment(a.id)} />
          ))}
        </ScrollView>
      )}

      {/* Input row */}
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={handleAttach}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Paperclip size={20} color={disabled ? colors.textFaint : colors.textMuted} />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Ask CodeMate…"
          placeholderTextColor={colors.textFaint}
          multiline
          maxLength={2000}
          returnKeyType="default"
          blurOnSubmit={false}
          editable={!disabled}
          onSubmitEditing={Platform.OS === 'ios' ? undefined : handleSend}
        />

        <TouchableOpacity
          style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.8}
        >
          <Send size={16} color={canSend ? '#fff' : colors.textFaint} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.sm : spacing.md,
    gap: spacing.xs,
  },
  attachRow: {
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconBtn: { paddingBottom: 2 },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    maxHeight: 120,
    lineHeight: 22,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnActive: { backgroundColor: colors.accent },
  sendBtnDisabled: { backgroundColor: colors.surface },
});
