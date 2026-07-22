# FE Dev2Vec v12 Migration — Batch 1

Implementation date: 2026-07-23

## Scope delivered

Batch 1 implements additive frontend compatibility for:

- repository analysis typed states;
- current-repository primary role;
- additional portfolio role options;
- full selected `RoleOption` preservation across store/navigation.

Roadmap generation payload, backend, snapshot/dashboard full migration, feedback/chat, Coursera, learning, YouTube and progress contracts were not changed.

## New analysis types

`src/app/types/index.ts` now defines:

- `Dev2VecVersionInfo`;
- `Dev2VecCompatibility`;
- `AnalysisRequiredReason`;
- `RepositoryAnalysisState` discriminated by `analysisStatus`.

Available state contains a real `AnalysisResult`; required state contains a repository ID, reason and optional compatibility metadata. `AnalysisResult` additively retains `analysisId`, `snapshotId`, `modelVersion`, and `pipelineVersion`.

## Analysis normalization and state

Pure functions in `normalizerParts/analysis.ts`:

- `normalizeRepositoryAnalysisState(payload, fallbackRepositoryId)`;
- `normalizeRepositoryAnalysisStates(payload)`.

They branch on `analysisStatus`/`reason` before calling `normalizeAnalysis`, so `analysis_required`, `incompatible_analysis_history`, and `no_compatible_dev2vec_analysis` cannot become empty score DTOs.

Backward compatibility:

- A response without `analysisStatus` remains available only when it contains a real analysis identity (`id`, `analysisId`, `snapshotId`, or repository identity in the analysis payload).
- Existing `normalizeAnalysis` and `normalizeAnalyses` remain exported.
- Timestamp sorting was removed from `normalizeAnalyses`; current state is no longer selected by `createdAt`/`analyzedAt`.

`repositoryStore` keeps both:

- `analyses`: legacy-compatible list containing only available analyses;
- `analysisStatesByRepoId`: authoritative per-repository typed state.

It also keeps per-repository loading and request-error maps. A typed HTTP 200 state is stored as a domain state, not as a network error. `GET /analysis/me` preserves required entries rather than filtering their repositories away.

## Analysis UI states

`RepositoryDetailPage` now renders:

- an analysis-specific loading skeleton;
- compatible analysis content as before;
- dedicated incompatible-history copy;
- dedicated no-compatible-analysis copy;
- CTA `Phân tích lại repository`;
- request failure with a finite manual retry.

Score, role and AI chat actions are not rendered/enabled from an `analysis_required` state. `AnalysisResultPage` resolves through the typed-state store before redirecting to the repository detail state UI.

The direct `analyses[0]` score fallback was removed from `DashboardPage`. Full dashboard migration remains outside Batch 1.

## Role types and mapping

Additive role types:

- `RoleSelectionType`;
- `RoleOption`;
- `RoleSelection`;
- expanded `RepositoryRoleMatches` while retaining `topRole` and `matches`.

Pure role mappers in `roleMatchApi.ts` normalize new and legacy response shapes. Resolution order for primary role is:

1. `roleSelection.primaryRole`;
2. top-level `primaryRole`;
3. legacy `topRole`;
4. legacy `matches[0]`.

Only explicit `additionalRoleOptions` are treated as portfolio roles. They are deduplicated against the primary role and capped at two. Remaining legacy `matches` are shown under a clearly marked legacy-compatibility section and are not relabeled as portfolio options.

The role catalog is used only to enrich descriptions; catalog entries do not become authoritative `RoleOption` values.

## Role rendering semantics

`RoleMatchPanel` now renders:

1. `Vai trò phù hợp nhất với repository hiện tại` with the primary role;
2. `Các vai trò khác từ repository đã phân tích` with at most two explicit portfolio options;
3. source repository name or `selectionType` label for additional options;
4. a separate legacy section when only `topRole`/`matches` exist.

The panel exposes `onSelectRole(option: RoleOption)`.

## Selected RoleOption flow

`repositoryStore` adds:

- `selectedRoleOption: RoleOption | null`;
- `setSelectedRoleOption(option)`.

When a user selects a role in `RepositoryDetailPage`, the full object is:

1. stored in Zustand;
2. passed to `/roadmaps` as navigation state;
3. restored by `RoadmapsPage`;
4. kept in `authoritativeRoleOptions`, including source repository/analysis/snapshot and selection type.

Existing roadmap generation still receives the old `roleId`/`roleName` fields. Batch 1 deliberately does not change the POST payload; Batch 2 can consume `selectedRoleOption` to build provenance fields.

## Files changed

- `src/app/types/index.ts`
- `src/app/services/apis/analysisApi.ts`
- `src/app/services/apis/normalizerParts/analysis.ts`
- `src/app/services/apis/roleMatchApi.ts`
- `src/app/stores/repositoryStore.ts`
- `src/app/pages/analysis/AnalysisResultPage.tsx`
- `src/app/pages/repositories/RepositoryDetailPage.tsx`
- `src/app/pages/dashboard/DashboardPage.tsx` (single safe fallback removal)
- `src/app/components/analysis/RoleMatchPanel.tsx`
- `src/features/roadmaps/pages/RoadmapsPage.tsx`

No change was required in `normalizers/index.ts` because it already re-exports `normalizerParts`, which re-exports the analysis module.

## Verification

- `npm run build`: passed.
- 2,884 modules transformed successfully.
- Existing bundle-size warning remains; it is unrelated to Batch 1.
- No test runner is configured in `package.json`, so no dependency was added. The new state/role normalization is exposed as pure functions for later unit coverage.

Manual/unit cases prepared by the implementation:

- available v12 and legacy analysis;
- typed analysis required without empty DTO normalization;
- both required reasons and their CTA copy;
- mixed `/analysis/me` entries;
- explicit primary plus zero-to-two additional options;
- source repository label;
- legacy `topRole`/`matches` fallback;
- primary/additional deduplication;
- full selected-role provenance retained in store/navigation.

## Remaining Batch 2 work

- Build `POST /roadmaps/generate` from `selectedRoleOption`.
- Send `currentRepositoryId`, `selectedRoleId`, `sourceRepositoryId`, `sourceAnalysisId`, and `sourceSnapshotId`.
- Remove old authoritative multi-repository semantics and arbitrary role creation paths.
- Treat server-returned `roadmapSource` as authoritative and stop synthesizing provenance locally.

