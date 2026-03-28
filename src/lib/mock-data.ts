import { Repo, Commit, Finding } from '../types';

export const MOCK_REPOS: Repo[] = [
  {
    id: '1', name: 'backend-api', fullName: 'myorg/backend-api',
    description: 'RESTful API server with auth, rate limiting, and multi-tenant support',
    language: 'TypeScript', stars: 234, forks: 18,
    updatedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    isPrivate: false, defaultBranch: 'main',
  },
  {
    id: '2', name: 'frontend-app', fullName: 'myorg/frontend-app',
    description: 'Next.js 14 dashboard with real-time analytics and team collaboration',
    language: 'TypeScript', stars: 89, forks: 7,
    updatedAt: new Date(Date.now() - 5 * 3600_000).toISOString(),
    isPrivate: false, defaultBranch: 'main',
  },
  {
    id: '3', name: 'ml-pipeline', fullName: 'myorg/ml-pipeline',
    description: 'Automated ML training and inference pipeline using PyTorch and FastAPI',
    language: 'Python', stars: 45, forks: 5,
    updatedAt: new Date(Date.now() - 86_400_000).toISOString(),
    isPrivate: true, defaultBranch: 'develop',
  },
  {
    id: '4', name: 'mobile-client', fullName: 'myorg/mobile-client',
    description: 'Expo React Native app with offline-first architecture',
    language: 'TypeScript', stars: 12, forks: 2,
    updatedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    isPrivate: true, defaultBranch: 'main',
  },
];

const commitsForBackend: Commit[] = [
  {
    sha: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', shortSha: 'a1b2c3d',
    message: 'fix: resolve race condition in auth middleware token validation',
    author: 'Sarah Chen', authorEmail: 'sarah@myorg.io',
    timestamp: new Date(Date.now() - 45 * 60_000).toISOString(),
    files: [
      { filename: 'src/middleware/auth.ts', status: 'modified', additions: 23, deletions: 8, changes: 31 },
      { filename: 'src/utils/jwt.ts', status: 'modified', additions: 5, deletions: 2, changes: 7 },
      { filename: 'tests/middleware/auth.test.ts', status: 'modified', additions: 41, deletions: 10, changes: 51 },
    ],
    totalAdditions: 69, totalDeletions: 20,
  },
  {
    sha: 'e4f5a6b7c8d9e4f5a6b7c8d9e4f5a6b7c8d9e4f5', shortSha: 'e4f5a6b',
    message: 'feat: add Redis caching for user sessions and rate limit counters',
    author: 'Marcus Ali', authorEmail: 'marcus@myorg.io',
    timestamp: new Date(Date.now() - 2 * 3600_000).toISOString(),
    files: [
      { filename: 'src/services/cache.ts', status: 'added', additions: 120, deletions: 0, changes: 120 },
      { filename: 'src/routes/users.ts', status: 'modified', additions: 34, deletions: 12, changes: 46 },
      { filename: 'src/config/redis.ts', status: 'added', additions: 45, deletions: 0, changes: 45 },
    ],
    totalAdditions: 199, totalDeletions: 12,
  },
  {
    sha: 'c7d8e9f0a1b2c7d8e9f0a1b2c7d8e9f0a1b2c7d8', shortSha: 'c7d8e9f',
    message: 'refactor: extract validation logic into shared utils module',
    author: 'Priya Sharma', authorEmail: 'priya@myorg.io',
    timestamp: new Date(Date.now() - 5 * 3600_000).toISOString(),
    files: [
      { filename: 'src/utils/validation.ts', status: 'added', additions: 89, deletions: 0, changes: 89 },
      { filename: 'src/routes/auth.ts', status: 'modified', additions: 12, deletions: 67, changes: 79 },
      { filename: 'src/routes/users.ts', status: 'modified', additions: 8, deletions: 45, changes: 53 },
    ],
    totalAdditions: 109, totalDeletions: 112,
  },
  {
    sha: 'f0a1b2c3d4e5f0a1b2c3d4e5f0a1b2c3d4e5f0a1', shortSha: 'f0a1b2c',
    message: 'chore: upgrade dependencies and fix security advisories',
    author: 'DevBot', authorEmail: 'devbot@myorg.io',
    timestamp: new Date(Date.now() - 8 * 3600_000).toISOString(),
    files: [
      { filename: 'package.json', status: 'modified', additions: 15, deletions: 15, changes: 30 },
      { filename: 'bun.lock', status: 'modified', additions: 234, deletions: 234, changes: 468 },
    ],
    totalAdditions: 249, totalDeletions: 249,
  },
  {
    sha: 'b3c4d5e6f7a8b3c4d5e6f7a8b3c4d5e6f7a8b3c4', shortSha: 'b3c4d5e',
    message: 'fix: handle null pointer in payment webhook processor',
    author: 'Sarah Chen', authorEmail: 'sarah@myorg.io',
    timestamp: new Date(Date.now() - 12 * 3600_000).toISOString(),
    files: [
      { filename: 'src/webhooks/stripe.ts', status: 'modified', additions: 18, deletions: 6, changes: 24 },
      { filename: 'src/webhooks/types.ts', status: 'modified', additions: 4, deletions: 0, changes: 4 },
    ],
    totalAdditions: 22, totalDeletions: 6,
  },
];

const MOCK_COMMITS: Record<string, Commit[]> = {
  'myorg/backend-api': commitsForBackend,
  'myorg/frontend-app': [
    {
      sha: 'd1e2f3a4b5c6d1e2f3a4b5c6d1e2f3a4b5c6d1e2', shortSha: 'd1e2f3a',
      message: 'feat: implement real-time dashboard with WebSocket subscriptions',
      author: 'Jordan Taylor', authorEmail: 'jordan@myorg.io',
      timestamp: new Date(Date.now() - 30 * 60_000).toISOString(),
      files: [
        { filename: 'src/app/dashboard/page.tsx', status: 'modified', additions: 156, deletions: 34, changes: 190 },
        { filename: 'src/hooks/useWebSocket.ts', status: 'added', additions: 78, deletions: 0, changes: 78 },
      ],
      totalAdditions: 234, totalDeletions: 34,
    },
  ],
};

const MOCK_FINDINGS: Record<string, Finding[]> = {
  a1b2c3d: [
    {
      id: 'f1', commitSha: 'a1b2c3d',
      title: 'JWT token not invalidated atomically on concurrent requests',
      severity: 'critical',
      file: 'src/middleware/auth.ts', lines: [45, 62],
      explanation: 'The token check and deletion are not atomic. A revoked token could pass validation between the Redis GET and DEL calls under concurrent load.',
      suggestion: 'Use a Lua script or SETNX to atomically check-and-delete. Consider Redlock for distributed locking.',
      codeExcerpt: `const isValid = await cache.get(\`token:\${token}\`);\nif (isValid) {\n  await cache.del(\`token:\${token}\`); // race window!\n  return next();\n}`,
      sourceUrls: [
        'https://github.com/myorg/backend-api/blob/a1b2c3d/src/middleware/auth.ts#L45-L62',
        'https://owasp.org/www-community/vulnerabilities/Insecure_Direct_Object_Reference',
      ],
    },
    {
      id: 'f2', commitSha: 'a1b2c3d',
      title: 'JWT secret falls back to hardcoded default value',
      severity: 'high',
      file: 'src/utils/jwt.ts', lines: [12, 14],
      explanation: 'If JWT_SECRET env var is missing in production, tokens are signed with the literal string "secret", allowing anyone to forge valid tokens.',
      suggestion: 'Remove the fallback. Throw an error at startup if JWT_SECRET is not configured.',
      codeExcerpt: `const SECRET = process.env.JWT_SECRET || 'secret'; // ❌`,
      sourceUrls: ['https://cwe.mitre.org/data/definitions/798.html'],
    },
  ],
  e4f5a6b: [
    {
      id: 'f3', commitSha: 'e4f5a6b',
      title: 'Redis connection not closed on process exit',
      severity: 'medium',
      file: 'src/config/redis.ts', lines: [34, 50],
      explanation: 'No SIGTERM/SIGINT handler registered. In Kubernetes, dangling connections cause memory leaks and slow pod shutdown.',
      suggestion: "Add `process.on('SIGTERM', () => redis.quit())` after client initialization.",
      sourceUrls: ['https://github.com/myorg/backend-api/blob/e4f5a6b/src/config/redis.ts#L34-L50'],
    },
    {
      id: 'f4', commitSha: 'e4f5a6b',
      title: 'User email exposed unredacted in Redis cache key',
      severity: 'high',
      file: 'src/services/cache.ts', lines: [78, 82],
      explanation: 'Cache key `session:${email}` exposes PII in Redis key names. This may violate GDPR Article 25.',
      suggestion: 'Hash the email: `session:${createHash("sha256").update(email).digest("hex")}`',
      sourceUrls: ['https://gdpr-info.eu/art-25-gdpr/'],
    },
  ],
  c7d8e9f: [
    {
      id: 'f5', commitSha: 'c7d8e9f',
      title: 'Email validation regex vulnerable to ReDoS',
      severity: 'medium',
      file: 'src/utils/validation.ts', lines: [23, 25],
      explanation: 'Nested quantifiers in the email regex can cause catastrophic backtracking on crafted inputs, blocking the event loop.',
      suggestion: "Use `validator.isEmail()` from the validator.js library instead of a custom regex.",
      codeExcerpt: `const EMAIL_RE = /^([a-zA-Z0-9._%+-]+)+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;`,
      sourceUrls: ['https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS'],
    },
  ],
  b3c4d5e: [
    {
      id: 'f6', commitSha: 'b3c4d5e',
      title: 'Stripe webhook signature not verified before payload access',
      severity: 'critical',
      file: 'src/webhooks/stripe.ts', lines: [12, 18],
      explanation: 'event.data.object is accessed before stripe.webhooks.constructEvent(). Forged payloads get partially processed before failing signature check.',
      suggestion: 'Always call constructEvent() as the very first operation before touching any event properties.',
      codeExcerpt: `const { type, data } = req.body; // ❌ forged data\nconst event = stripe.webhooks.constructEvent(rawBody, sig, secret);`,
      sourceUrls: ['https://stripe.com/docs/webhooks/signatures'],
    },
  ],
};

export const getMockRepos = (): Repo[] => MOCK_REPOS;

export const getMockCommits = (repoFullName: string, count?: number): Commit[] => {
  const list = MOCK_COMMITS[repoFullName] ?? commitsForBackend;
  return count ? list.slice(0, count) : list;
};

export const getMockFindings = (shortSha: string): Finding[] =>
  MOCK_FINDINGS[shortSha] ?? [];
