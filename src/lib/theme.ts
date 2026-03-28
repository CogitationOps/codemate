export const colors = {
  bg: '#0D1117',
  surface: '#161B22',
  surface2: '#21262D',
  border: '#30363D',
  borderSubtle: '#21262D',

  text: '#E6EDF3',
  textMuted: '#8B949E',
  textFaint: '#484F58',

  accent: '#208AEF',
  accentDim: 'rgba(32, 138, 239, 0.12)',
  accentBorder: 'rgba(32, 138, 239, 0.35)',

  successText: '#3FB950',
  successDim: 'rgba(35, 134, 54, 0.15)',

  dangerText: '#F85149',
  dangerDim: 'rgba(218, 54, 51, 0.15)',

  warningText: '#D29922',
  warningDim: 'rgba(210, 153, 34, 0.15)',
} as const;

export const severity = {
  critical: { bg: 'rgba(218,54,51,0.12)', text: '#F85149', border: '#DA3633', label: 'CRITICAL' },
  high:     { bg: 'rgba(210,153,34,0.12)', text: '#D29922', border: '#9E6A03', label: 'HIGH' },
  medium:   { bg: 'rgba(32,138,239,0.12)', text: '#58A6FF', border: '#1F6FEB', label: 'MEDIUM' },
  low:      { bg: 'rgba(35,134,54,0.12)',  text: '#3FB950', border: '#238636', label: 'LOW' },
  info:     { bg: 'rgba(139,148,158,0.12)', text: '#8B949E', border: '#484F58', label: 'INFO' },
} as const;

export const languageColors: Record<string, string> = {
  TypeScript: '#3178C6',
  JavaScript: '#F7DF1E',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#DEA584',
  Swift: '#FA7343',
  Ruby: '#CC342D',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
};

export const radius = { xs: 4, sm: 6, md: 10, lg: 16, xl: 20, full: 9999 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;
export const fontSize = { xs: 10, sm: 12, md: 14, base: 15, lg: 17, xl: 20, xxl: 24 } as const;
