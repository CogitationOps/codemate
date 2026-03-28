import React, { useRef, useEffect } from 'react';
import {
  FlatList, View, Text, StyleSheet, Animated,
} from 'react-native';
import { SimpleMarkdown } from './SimpleMarkdown';
import { Message } from '../types';
import { colors, radius, spacing, fontSize } from '../lib/theme';
import { CommitCard } from './CommitCard';
import { FindingCard } from './FindingCard';
import { SourcesCollapsible } from './SourcesCollapsible';

// Animated typing dots
function TypingIndicator() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.typingRow}>
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={[styles.typingDot, { opacity: d, transform: [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }] }]}
        />
      ))}
    </View>
  );
}

function MessageBubble({ message: m }: { message: Message }) {
  const isUser = m.role === 'user';

  return (
    <View style={[styles.bubbleWrapper, isUser ? styles.userWrapper : styles.assistantWrapper]}>
      {!isUser && (
        <View style={styles.botAvatar}>
          <Text style={styles.botAvatarText}>CM</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {/* Streaming indicator */}
        {m.isStreaming && <TypingIndicator />}

        {/* Text content */}
        {m.content ? (
          isUser ? (
            <Text style={styles.userText}>{m.content}</Text>
          ) : (
            <SimpleMarkdown>{m.content}</SimpleMarkdown>
          )
        ) : null}

        {/* Commits */}
        {m.commits && m.commits.length > 0 && (
          <View style={styles.section}>
            {m.commits.map((c) => <CommitCard key={c.sha} commit={c} />)}
          </View>
        )}

        {/* Findings */}
        {m.findings && m.findings.length > 0 && (
          <View style={styles.section}>
            {m.findings.map((f) => <FindingCard key={f.id} finding={f} />)}
          </View>
        )}

        {/* Sources */}
        {m.sources && m.sources.length > 0 && (
          <SourcesCollapsible sources={m.sources} />
        )}
      </View>
    </View>
  );
}

type Props = { messages: Message[] };

export function MessageList({ messages }: Props) {
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>CodeMate</Text>
        <Text style={styles.emptySubtitle}>Scan your commits for bugs and security issues</Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(m) => m.id}
      renderItem={({ item }) => <MessageBubble message={item} />}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  bubbleWrapper: { flexDirection: 'row', gap: spacing.sm },
  userWrapper: { justifyContent: 'flex-end' },
  assistantWrapper: { justifyContent: 'flex-start', alignItems: 'flex-start' },
  bubble: { maxWidth: '90%', borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  userBubble: { backgroundColor: colors.accent, borderBottomRightRadius: radius.xs },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.xs,
    maxWidth: '98%',
  },
  userText: { color: '#fff', fontSize: fontSize.base, lineHeight: 22 },
  botAvatar: {
    width: 28, height: 28, borderRadius: radius.full,
    backgroundColor: colors.accentDim,
    borderWidth: 1, borderColor: colors.accentBorder,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 4,
  },
  botAvatarText: { color: colors.accent, fontSize: 9, fontWeight: '700' },
  section: { gap: spacing.xs },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textMuted },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xxl },
  emptyTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700' },
  emptySubtitle: { color: colors.textMuted, fontSize: fontSize.base, textAlign: 'center', lineHeight: 22 },
});


