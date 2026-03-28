import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, AlertCircle, Info, ShieldAlert, CheckCircle2 } from '../lib/icons';
import { Finding } from '../types';
import { colors, severity as sev, radius, spacing, fontSize } from '../lib/theme';
import { CodeSnippet } from './CodeSnippet';
import { SourcesCollapsible } from './SourcesCollapsible';

function SeverityIcon({ s }: { s: Finding['severity'] }) {
  const sz = 13;
  const col = sev[s].text;
  switch (s) {
    case 'critical': return <ShieldAlert size={sz} color={col} />;
    case 'high': return <AlertCircle size={sz} color={col} />;
    case 'medium': return <AlertTriangle size={sz} color={col} />;
    case 'low': return <CheckCircle2 size={sz} color={col} />;
    default: return <Info size={sz} color={col} />;
  }
}

type Props = { finding: Finding };

export function FindingCard({ finding: f }: Props) {
  const s = sev[f.severity];
  const sources = f.sourceUrls.map((url) => ({ title: f.file, url }));

  return (
    <View style={[styles.card, { borderLeftColor: s.border, backgroundColor: s.bg }]}>
      {/* Badge + title */}
      <View style={styles.titleRow}>
        <SeverityIcon s={f.severity} />
        <View style={[styles.badge, { backgroundColor: s.bg, borderColor: s.border }]}>
          <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
        </View>
        <Text style={styles.title}>{f.title}</Text>
      </View>

      {/* Location */}
      <Text style={styles.location}>
        {f.file}:{f.lines[0]}–{f.lines[1]}
      </Text>

      {/* Explanation */}
      <Text style={styles.body}>{f.explanation}</Text>

      {/* Suggestion */}
      <View style={styles.suggestionBox}>
        <Text style={styles.suggestionLabel}>💡 Suggestion</Text>
        <Text style={styles.suggestionText}>{f.suggestion}</Text>
      </View>

      {/* Code */}
      {f.codeExcerpt && <CodeSnippet code={f.codeExcerpt} language="typescript" />}

      {/* Sources */}
      {sources.length > 0 && <SourcesCollapsible sources={sources} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 3,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.xs,
    gap: spacing.sm,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  badge: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 0.5 },
  title: { flex: 1, color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  location: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontFamily: 'Menlo, monospace',
  },
  body: { color: colors.text, fontSize: fontSize.md, lineHeight: 20 },
  suggestionBox: {
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    padding: spacing.sm,
    gap: 4,
  },
  suggestionLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  suggestionText: { color: colors.text, fontSize: fontSize.md, lineHeight: 20 },
});
