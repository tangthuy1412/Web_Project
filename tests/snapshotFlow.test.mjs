import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { unlink } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'

const bundlePath = new URL('./.snapshotFlow.bundle.mjs', import.meta.url)
const bundleFile = fileURLToPath(bundlePath)
await build({
  entryPoints: ['src/app/services/apis/snapshotApi.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  define: { 'import.meta.env': '{}' },
  outfile: bundleFile
})
const {
  formatReadinessDelta,
  formatReadinessScore,
  mapSnapshotDetail,
  mapSnapshotComparison,
  normalizeSnapshotPair,
  selectDefaultSnapshotPair
} = await import(pathToFileURL(bundleFile))
await unlink(bundleFile)

const snapshot = (id, date) => ({
  id,
  repositoryId: 'repo-1',
  createdAt: date,
  missingSkills: [],
  overallScore: 70
})

test('selects previous as from and newest as to for newest-first history', () => {
  const pair = selectDefaultSnapshotPair([
    snapshot('newest', '2026-07-23T10:00:00Z'),
    snapshot('previous', '2026-07-22T10:00:00Z')
  ])
  assert.deepEqual(pair, { fromSnapshotId: 'previous', toSnapshotId: 'newest' })
})

test('normalizes a reversed selection to chronological from/to IDs', () => {
  const pair = normalizeSnapshotPair(
    snapshot('newest', '2026-07-23T10:00:00Z'),
    snapshot('oldest', '2026-07-20T10:00:00Z')
  )
  assert.deepEqual(pair, { fromSnapshotId: 'oldest', toSnapshotId: 'newest' })
  assert.equal(normalizeSnapshotPair(snapshot('same', '2026-07-20'), snapshot('same', '2026-07-21')), null)
})

test('maps optional Dev2Vec detail fields from debug.dev2vec safely', () => {
  const detail = mapSnapshotDetail({
    snapshotId: 'snapshot-1',
    repositoryId: 'repo-1',
    createdAt: '2026-07-23T10:00:00Z',
    summary: { userReadinessScore: 84, userLevel: 'intermediate' },
    debug: {
      dev2vec: {
        modelVersion: 'dev2vec-demo-v4',
        rolePredictions: [{ roleName: 'DevOps Engineer' }],
        skillGaps: { missing: ['CI/CD'] },
        vectorSources: { repository: true },
        sourceStats: { files: 27 }
      }
    }
  })
  assert.equal(detail.id, 'snapshot-1')
  assert.equal(detail.overallScore, 84)
  assert.equal(detail.modelVersion, 'dev2vec-demo-v4')
  assert.equal(detail.rolePredictions.length, 1)
  assert.deepEqual(detail.skillGapSummary, { missing: ['CI/CD'] })
  assert.deepEqual(detail.vectorSources, { repository: true })
  assert.deepEqual(detail.sourceStats, { files: 27 })
})

test('uses the same decimal precision for a readiness decrease', () => {
  assert.equal(formatReadinessScore(85.4), '85.4')
  assert.equal(formatReadinessScore(84.6), '84.6')
  assert.equal(formatReadinessDelta(-0.8), '-0.8')
})

test('renders an unchanged readiness score and zero delta consistently', () => {
  assert.equal(formatReadinessScore(85), '85')
  assert.equal(formatReadinessDelta(0), '0')
})

test('renders a positive decimal readiness delta with an explicit sign', () => {
  assert.equal(formatReadinessScore(84.6), '84.6')
  assert.equal(formatReadinessScore(85.4), '85.4')
  assert.equal(formatReadinessDelta(0.8), '+0.8')
})

test('does not produce NaN for missing readiness values', () => {
  assert.equal(formatReadinessScore(null), '—')
  assert.equal(formatReadinessScore(undefined), '—')
  assert.equal(formatReadinessDelta(null), '—')
  assert.equal(formatReadinessDelta(undefined), '—')
})

test('maps the current compare contract without scaling or rounding raw scores', () => {
  const comparison = mapSnapshotComparison({
    success: true,
    data: {
      repositoryId: 'repo-1',
      repoName: 'HCM-City-Rain-Map---Mua-Sai-Gon',
      comparisonMode: 'dev2vec_skill_similarity',
      comparableSkillScores: true,
      fromSnapshot: {
        snapshotId: 'from-1',
        createdAt: '2026-07-23T04:09:28.471Z',
        userReadinessScore: 85.41,
        userLevel: 'advanced',
        scoringMethod: 'dev2vec_doc2vec_classifier'
      },
      toSnapshot: {
        snapshotId: 'to-1',
        createdAt: '2026-07-23T04:10:21.375Z',
        userReadinessScore: 84.53,
        userLevel: 'advanced',
        scoringMethod: 'dev2vec_doc2vec_classifier'
      },
      delta: {
        userReadinessScore: -0.88,
        levelChanged: false,
        fromLevel: 'advanced',
        toLevel: 'advanced',
        userCommitsDelta: 0,
        activeDaysDelta: 0
      },
      skillChanges: [{
        skillName: 'Responsive Design',
        canonicalSkillName: 'Responsive Design',
        category: 'frontend',
        fromScore: 8.75,
        toScore: 21.25,
        delta: 12.5,
        trend: 'improved'
      }],
      newSkills: [],
      improvedSkills: [{
        skillName: 'Responsive Design',
        fromScore: 8.75,
        toScore: 21.25,
        delta: 12.5,
        trend: 'improved'
      }],
      weakerSkills: [],
      resolvedMissingSkills: [],
      newMissingSkills: [],
      warnings: []
    }
  })

  assert.equal(comparison.firstSnapshot.overallScore, 85.41)
  assert.equal(comparison.latestSnapshot.overallScore, 84.53)
  assert.equal(comparison.delta.userReadinessScore, -0.88)
  assert.equal(comparison.overallChange, -0.88)
  assert.equal(comparison.skillChanges[0].fromScore, 8.75)
  assert.equal(comparison.skillChanges[0].toScore, 21.25)
  assert.equal(comparison.skillChanges[0].delta, 12.5)
  assert.equal(comparison.skillChanges[0].beforePercent, 8.75)
  assert.equal(comparison.skillChanges[0].afterPercent, 21.25)
})

test('preserves zero activity deltas and does not invent missing deltas', () => {
  const withZeroDeltas = mapSnapshotComparison({
    data: {
      fromSnapshot: { snapshotId: 'from', userReadinessScore: 70 },
      toSnapshot: { snapshotId: 'to', userReadinessScore: 70 },
      delta: { userReadinessScore: 0, userCommitsDelta: 0, activeDaysDelta: 0 }
    }
  })
  assert.equal(withZeroDeltas.delta.userCommitsDelta, 0)
  assert.equal(withZeroDeltas.delta.activeDaysDelta, 0)

  const withoutActivityDeltas = mapSnapshotComparison({
    data: {
      fromSnapshot: { snapshotId: 'from', userReadinessScore: 70 },
      toSnapshot: { snapshotId: 'to', userReadinessScore: 70 },
      delta: { userReadinessScore: 0 }
    }
  })
  assert.equal(withoutActivityDeltas.delta.userCommitsDelta, undefined)
  assert.equal(withoutActivityDeltas.delta.activeDaysDelta, undefined)
})
