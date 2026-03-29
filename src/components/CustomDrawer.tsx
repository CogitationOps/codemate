import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { usePathname, useRouter } from 'expo-router';
import { MessageSquare, FolderGit2, GitBranch, Wifi, WifiOff } from '../lib/icons';
import { colors, radius, spacing, fontSize } from '../lib/theme';
import { useRepo } from '../lib/repo-context';

type NavItem = { label: string; route: string; Icon: React.ComponentType<{ size: number; color: string }> };

const NAV_ITEMS: NavItem[] = [
  { label: 'Chat', route: '/', Icon: MessageSquare },
  { label: 'Projects', route: '/projects', Icon: FolderGit2 },
];

export function CustomDrawer(props: DrawerContentComponentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, selectedRepo } = useRepo();
  const insets = useSafeAreaInsets();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      {/* Brand */}
      <View style={[styles.brand, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.brandIcon}>
          <GitBranch size={18} color={colors.accent} />
        </View>
        <Text style={styles.brandName}>CodeMate</Text>
      </View>

      <View style={styles.divider} />

      {/* Nav items */}
      <View style={styles.nav}>
        {NAV_ITEMS.map(({ label, route, Icon }) => {
          const active = pathname === route || (route === '/' && pathname === '');
          return (
            <TouchableOpacity
              key={route}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => { router.push(route as any); props.navigation.closeDrawer(); }}
              activeOpacity={0.7}
            >
              <Icon size={17} color={active ? colors.accent : colors.textMuted} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
              {active && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.spacer} />

      {/* Selected repo */}
      {selectedRepo && (
        <View style={styles.repoSection}>
          <Text style={styles.sectionLabel}>ANALYZING</Text>
          <View style={styles.repoPill}>
            <GitBranch size={12} color={colors.accent} />
            <Text style={styles.repoName} numberOfLines={1}>{selectedRepo.fullName}</Text>
          </View>
          <Text style={styles.repoBranch}>{selectedRepo.defaultBranch}</Text>
        </View>
      )}

      <View style={styles.divider} />

      {/* Token status */}
      <View style={styles.footer}>
        {token && token !== '__mock__' ? (
          <>
            <Wifi size={14} color={colors.successText} />
            <Text style={[styles.footerText, { color: colors.successText }]}>Connected to GitHub</Text>
          </>
        ) : (
          <>
            <WifiOff size={14} color={colors.textMuted} />
            <Text style={styles.footerText}>Using mock data</Text>
          </>
        )}
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, padding: 0 },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  brandIcon: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.accentDim,
    borderWidth: 1, borderColor: colors.accentBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  brandName: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.xl },
  nav: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: 2 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  navItemActive: { backgroundColor: colors.accentDim },
  navLabel: { flex: 1, color: colors.textMuted, fontSize: fontSize.base, fontWeight: '500' },
  navLabelActive: { color: colors.accent },
  activeDot: { width: 6, height: 6, borderRadius: radius.full, backgroundColor: colors.accent },
  spacer: { flex: 1 },
  repoSection: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, gap: spacing.xs },
  sectionLabel: { color: colors.textFaint, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 1 },
  repoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  repoName: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '600', maxWidth: 160 },
  repoBranch: { color: colors.textFaint, fontSize: fontSize.xs },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  footerText: { color: colors.textMuted, fontSize: fontSize.sm },
});
