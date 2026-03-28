import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Star, Lock, GitBranch, Search, Check, Menu,
} from '../lib/icons';
import { Repo } from '../types';
import { useRepo } from '../lib/repo-context';
import { colors, languageColors, radius, spacing, fontSize } from '../lib/theme';

function LangDot({ lang }: { lang: string }) {
  const col = languageColors[lang] ?? colors.textMuted;
  return <View style={[styles.langDot, { backgroundColor: col }]} />;
}

function RepoCard({ repo, selected, onSelect }: { repo: Repo; selected: boolean; onSelect: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          {repo.isPrivate && <Lock size={12} color={colors.textMuted} />}
          <Text style={styles.cardTitle} numberOfLines={1}>{repo.name}</Text>
          {selected && (
            <View style={styles.selectedBadge}>
              <Check size={10} color={colors.accent} />
              <Text style={styles.selectedText}>Active</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardOrg}>{repo.fullName.split('/')[0]}</Text>
      </View>

      {repo.description ? (
        <Text style={styles.description} numberOfLines={2}>{repo.description}</Text>
      ) : null}

      <View style={styles.cardFooter}>
        {repo.language && (
          <View style={styles.footerItem}>
            <LangDot lang={repo.language} />
            <Text style={styles.footerText}>{repo.language}</Text>
          </View>
        )}
        <View style={styles.footerItem}>
          <Star size={11} color={colors.textMuted} />
          <Text style={styles.footerText}>{repo.stars}</Text>
        </View>
        <View style={styles.footerItem}>
          <GitBranch size={11} color={colors.textMuted} />
          <Text style={styles.footerText}>{repo.defaultBranch}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ProjectsScreen() {
  const router = useRouter();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const { repos, selectedRepo, selectRepo, refreshRepos, loading } = useRepo();
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      query.trim()
        ? repos.filter(
            (r) =>
              r.name.toLowerCase().includes(query.toLowerCase()) ||
              r.description?.toLowerCase().includes(query.toLowerCase()),
          )
        : repos,
    [repos, query],
  );

  const handleSelect = (repo: Repo) => {
    selectRepo(repo);
    router.push('/');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuBtn}>
          <Menu size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Projects</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Search size={15} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search repositories…"
          placeholderTextColor={colors.textFaint}
          clearButtonMode="while-editing"
        />
      </View>

      {loading && repos.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Fetching repositories…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <RepoCard
              repo={item}
              selected={selectedRepo?.id === item.id}
              onSelect={() => handleSelect(item)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refreshRepos}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>No repositories found</Text>
              <Text style={styles.emptySubtitle}>Try a different search term</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuBtn: { padding: 4, width: 36 },
  headerTitle: { flex: 1, color: colors.text, fontSize: fontSize.lg, fontWeight: '700', textAlign: 'center' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.lg,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: fontSize.base },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardSelected: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  cardHeader: { gap: 2 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardTitle: { flex: 1, color: colors.text, fontSize: fontSize.base, fontWeight: '600' },
  cardOrg: { color: colors.textMuted, fontSize: fontSize.sm },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  selectedText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '600' },
  description: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.xs },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { color: colors.textMuted, fontSize: fontSize.sm },
  langDot: { width: 10, height: 10, borderRadius: radius.full },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  loadingText: { color: colors.textMuted, fontSize: fontSize.base },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  emptySubtitle: { color: colors.textMuted, fontSize: fontSize.base },
});
