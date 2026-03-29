import React from 'react';
import {
  View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Text,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { GitBranch, Menu, Trash2 } from '../lib/icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageList } from '../components/MessageList';
import { ChatInput } from '../components/ChatInput';
import { SuggestionChips } from '../components/SuggestionChips';
import { useChat } from '../lib/chat-context';
import { useRepo } from '../lib/repo-context';
import { colors, spacing, fontSize, radius } from '../lib/theme';

export default function ChatScreen() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const { messages, isStreaming, sendMessage, clearChat } = useChat();
  const { selectedRepo } = useRepo();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Custom header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.headerBtn}>
          <Menu size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {selectedRepo ? (
            <>
              <GitBranch size={13} color={colors.accent} />
              <Text style={styles.headerRepo} numberOfLines={1}>{selectedRepo.name}</Text>
              <View style={styles.branchChip}>
                <Text style={styles.branchText}>{selectedRepo.defaultBranch}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.headerTitle}>CodeMate</Text>
          )}
        </View>

        <TouchableOpacity onPress={clearChat} style={styles.headerBtn} disabled={messages.length === 0}>
          <Trash2 size={18} color={messages.length > 0 ? colors.textMuted : colors.textFaint} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <View style={styles.flex}>
          <MessageList messages={messages} />
        </View>

        {/* Suggestion chips — show when no messages */}
        {messages.length === 0 && (
          <SuggestionChips onSelect={(p) => sendMessage(p)} />
        )}

        {/* Input */}
        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: { padding: 4, width: 36 },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  headerTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  headerRepo: { color: colors.text, fontSize: fontSize.base, fontWeight: '600', maxWidth: 120 },
  branchChip: {
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  branchText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '500' },
});
