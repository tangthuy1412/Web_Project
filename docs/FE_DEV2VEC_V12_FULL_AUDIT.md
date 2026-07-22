# Frontend Dev2Vec v12 Full Audit

Audit date: 2026-07-23  
Scope: frontend only; no production code changed.  
Source of truth: `DEV2VEC_FRONTEND_INTEGRATION_GUIDE.md` at repository root. The requested path `docs/DEV2VEC_FRONTEND_INTEGRATION_GUIDE.md` does not exist; the root file is untracked and was read in full. Move/copy it separately only after confirming ownership.

## 1. Executive Summary

The frontend is a React 18 + TypeScript SPA built with Vite 6 and React Router 7. The application is flow-first: shared pages, API clients and global stores live under `src/app`; the roadmap domain owns pages, components, stores, services and types under `src/features/roadmaps`.

Data fetching uses one Axios instance (`apiClient`) plus Zustand stores or page-local `useEffect`/state. There is no React Query/TanStack Query, Redux, or request cache with query keys. Authentication is a local-storage bearer token attached by an Axios request interceptor. A 401 clears token/user and navigates to `/login`; there is no refresh-token request. Response DTOs are generally unwrapped or normalized in service files.

This audit tracks 20 requested features: **3 compatible, 7 partially compatible, 9 need change, and 1 missing**. The compatible features are learning-by-item, YouTube/resource rendering, and roadmap learning progress. The missing feature is roadmap-level Coursera recommendations. The most urgent gaps are typed analysis compatibility states, role-option provenance, the roadmap generation payload, snapshot comparability/409 handling, and dashboard use of legacy client aggregation.

Critical blockers/findings:

- `normalizeAnalysis` and the UI do not preserve/render `analysisStatus`, `reason`, or `compatibility`; typed success states can be normalized into a fake/empty `AnalysisResult`.
- `RoleMatchPanel` renders `topRole` plus `matches.slice(0, 3)` as one list and does not consume `primaryRole`, `additionalRoleOptions`, `selectionType`, or source repository provenance.
- Roadmap creation still exposes arbitrary hard-coded roles and old multi-repository modes; it does not send `currentRepositoryId`, `selectedRoleId`, `sourceRepositoryId`, `sourceAnalysisId`, or `sourceSnapshotId`.
- Snapshot types/normalizers omit version and compatibility metadata; all snapshots remain selectable for comparison and typed 409/insufficient states collapse to generic/null behavior.
- Dashboard calls `/dashboard/me` but also independently aggregates repository analyses and renders `analyses[0]`/legacy career summaries without checking `dev2vecStatus`.
- Coursera service/types/component do not exist.

## 2. Current End-to-End Flow

```text
/repositories/:id
  -> RepositoryDetailPage
  -> repositoryStore.analyzeRepository / fetchAnalysis
  -> analysisApi POST /analysis/repositories/:repoId
     or GET /analysis/results/:repoId
  -> normalizeAnalysis
  -> /analysis/:id (AnalysisResultPage)
  -> RoleMatchPanel
  -> roleMatchApi GET /analysis/repositories/:repoId/role-matches

/roadmaps
  -> RoadmapsPage (hard-coded role/source-mode selection)
  -> roadmapStore.generateAIRoadmap
  -> roadmapService POST /roadmaps/generate
  -> normalizeBackendRoadmap
  -> /roadmaps/:id (RoadmapDetailPage)
  -> roadmapStore.fetchRoadmapDetail -> GET /roadmaps/:id
  -> learningStore.fetchRoadmapLearning -> GET /roadmaps/:id/learning
  -> RoadmapTree -> LearningNode per task
  -> /roadmaps/:id/learning/items/:itemId
  -> learningStore -> learningApi item detail/generate (includeResources=true)
  -> resource cards (including YouTube)
  -> roadmapStore progress GET/PATCH/POST reset

Expected additive tail (missing):
  -> GET /roadmaps/:id/course-recommendations once
  -> CourseraRecommendationSection after the Tabs, before page closing container
```

Analysis history and repository progress are separate routes/data models. `/progress` uses snapshot endpoints and must remain distinct from roadmap learning progress.

## 3. API Usage Matrix

| Feature | Endpoint | Current FE file/function | Current behavior | v12 requirement | Gap |
|---|---|---|---|---|---|
| Repository analysis | `POST /analysis/repositories/{repoId}` | `analysisApi.analyzeRepository`; `repositoryStore.analyzeRepository` | Sends `includeEvidence`; normalizes result | Preserve IDs, versions, compatible result | Versions/status not represented |
| Analysis result | `GET /analysis/results/{repoId}` | `analysisApi.getResult`; `repositoryStore.fetchAnalysis` | Treats any resolved payload as analysis | Branch on `analysisStatus`, `reason`, `compatibility` | Typed state unsupported |
| Analysis list | `GET /analysis/me` | `analysisApi.getMine`; `repositoryStore.fetchMyAnalyses` | Normalizes array and replaces store | Keep each repo and its compatible/required state | Required-state entries may be lost |
| Single-repo role match | `GET /analysis/repositories/{repoId}/role-matches` | `RoleMatchPanel.load` -> `roleMatchApi.getRepositoryRoleMatches` | Renders `topRole` and first three `matches` | Render primary separately; portfolio options with provenance | New fields ignored |
| Portfolio role options | `POST /analysis/role-matches` | `roleMatchApi.getRoleMatches`; Roadmaps flow | Requests `limit: 3`; old aggregated role semantics | Repository-primary options; no merged inference wording | Metadata ignored; old copy/selection |
| Role catalog | `GET /roles/catalog` | `RoleMatchPanel.load`; Roadmaps uses constants | Used to enrich rows; creation uses hard-coded list | Display metadata only; do not authorize arbitrary roadmap role | Creation still arbitrary |
| Roadmap generation | `POST /roadmaps/generate` | `roadmapService.generateAIRoadmap` | Sends `forceRegenerate`, `roleId`, nested `selectedRole`, `targetRole`, `sourceMode`, `repoId/repoIds` | Send current repo + selected role provenance | P0 payload mismatch |
| Roadmap list/detail | `GET /roadmaps/me`, `GET /roadmaps/{id}` | `roadmapService.getRoadmaps/getRoadmapById` | Extracts envelope and normalizes DTO | Preserve server provenance fields | Partial; source fields are incomplete |
| Learning list | `GET /roadmaps/{id}/learning` | `learningApi.getRoadmapLearning` | Unwraps, maps item availability | Contract unchanged | Compatible |
| Learning item | `GET /roadmaps/{id}/learning/items/{itemId}` | `learningApi.getRoadmapLearningItem` | Requests `includeResources=true`, normalizes content | Contract unchanged | Compatible |
| Learning generation | `POST /roadmaps/{id}/learning/items/{itemId}/generate` | `learningApi.generateRoadmapLearningItem` | Finite user/store-triggered generation | Contract unchanged | Compatible |
| Roadmap progress | GET/PATCH/reset under `/roadmaps/{id}/progress` | `roadmapService.get/update/resetRoadmapProgress` | Store merges progress into nodes | Keep separate from snapshots | Compatible, local status mapping is fragile |
| Snapshot list/detail | GET repository snapshots / snapshot detail | `snapshotApi.getSnapshots/getSnapshot` | Normalizes content, not compatibility | Show versions; distinguish viewable/current/comparable | Missing metadata/UI |
| Snapshot comparison | POST `/snapshots/compare` | `RepositoryProgressPage.compareSnapshots` | Generic error; all snapshots selectable | Disable incompatible; handle 409 typed state | Needs change |
| Auto progress comparison | GET repository progress-comparison | `RepositoryProgressPage.load`; `snapshotApi.getProgressComparison` | `.catch(() => null)`, then can fall back to snapshot endpoints | Handle `insufficient_compatible_snapshots`; no legacy fallback | Typed state swallowed |
| Dashboard | `GET /dashboard/me` | `DashboardPage` -> `dashboardApi.me` | Also fetches repos/analyses and aggregates client-side | Honor `dev2vecStatus`; backend contract authoritative | Needs change |
| AI feedback | POST/GET result/GET mine | `aiFeedbackApi`; `repositoryStore` | Normalizes legacy content; generic errors | Handle analysis conflicts and stale metadata | Needs change |
| AI chat | POST session messages | `chatStore.sendMessage` -> `chatApi.sendMessage` | Supports one `repositoryId`; no source badges | Explicit `repositoryIds` (2-5); context metadata | Needs change |
| Coursera | `GET /roadmaps/{id}/course-recommendations` | None | Not implemented | One roadmap-level additive request | Missing |

All client paths omit `/api` because `API_BASE_URL` is the base prefix.

## 4. Component/Screen Map

| Route | Entry | Important children/data |
|---|---|---|
| `/repositories/:id` and `/repositories/:id/analysis` | `RepositoryDetailPage` | repository data, `RoleMatchPanel`, feedback cards, analysis actions |
| `/analysis/:id` | `AnalysisResultPage` | analysis from `repositoryStore`; score/skill/recommendation views |
| `/roadmaps` | `RoadmapsPage` | source-mode/repository/role selection, roadmap list/cards |
| `/roadmaps/:id` | `RoadmapDetailPage` | header, provenance card, role/skill-gap card, `Tabs` -> `RoadmapTree` |
| `/roadmaps/:id/learning/items/:itemId` | `SkillLearningDetailPage` | content, examples, exercises, resource cards, completion action |
| `/roadmaps/:id/skills/:skillName` | `SkillLearningDetailPage` | legacy skill-name learning route |
| `/progress` | `RepositoryProgressPage` | repository selector, timeline, snapshot list, charts, manual comparison |
| `/dashboard` | `DashboardPage` | backend dashboard plus client-computed analysis overview |
| `/chat` | `ChatPage` | session list, single-repository context selector, messages |

Actual roadmap-detail tree:

```text
RoadmapDetailPage
├─ action bar / archived state
├─ roadmap header and progress summary
├─ roadmap source/effective-level card
├─ role-match and skill-gap card
└─ Tabs
   ├─ roadmap -> Card -> RoadmapTree
   │  └─ roadmap.modules.map
   │     └─ module.nodes.map -> LearningNode
   ├─ objectives
   └─ supporting paths
```

## 5. Analysis Compatibility Findings

Status: **needs_change (P0)**.

- `analysisApi` correctly centralizes the three endpoints and calls `unwrapResponse`, but the public `AnalysisResult` lacks compatibility/status fields.
- `repositoryStore.fetchAnalysis` immediately calls `normalizeAnalysis` on any successful payload. It has no branch for `analysis_required`, `incompatible_analysis_history`, or `no_compatible_dev2vec_analysis`.
- `fetchMyAnalyses` expects a list of analysis records; it has no per-repository typed state model.
- `AnalysisResultPage` looks up an item by ID/repository ID and renders it as current; it has no re-analysis CTA driven by typed state.
- No explicit timestamp sort was found in the analysis fetch path. However `DashboardPage` uses `analyses[0]` and `buildRepositoryAnalysisOverview(analyses)`, implicitly trusting list order and mixing legacy/current analyses. This is the practical “latest/list-order wins” behavior to remove.
- The normalizer supplies defaults for missing analysis fields, so a typed envelope risks being presented as a zero/empty analysis instead of a transition state.

Required change: introduce additive compatibility/status types, preserve typed states at the API boundary, and render a dedicated state with a re-analysis CTA. Do not determine currency by timestamps or array position.

## 6. Role Selection Findings

Status: **needs_change (P0)**.

- `RoleMatchPanel` loads the correct single-repo endpoint, but `matches = data?.matches ?? []` and `visibleMatches = matches.slice(0, 3)` preserve old top-N presentation.
- The panel does not read `roleSelection.primaryRole`, top-level `primaryRole`, `additionalRoleOptions`, `selectionType`, or `sourceRepositoryName`.
- `RoleMatch` contains `modelVersion` but not the full `RoleOption` provenance contract.
- `roleMatchApi.getRoleMatches` forces `limit: 3`; this reinforces old “top 3” semantics.
- `RoadmapsPage` uses `roadmapTargetRoles`/static mappings and allows role selection independent of a backend-returned `RoleOption`. `/roles/catalog` and constants must remain display metadata only.

Required UI: one primary-role card labeled for the current repository, followed by zero-to-two portfolio role cards labeled with their source repository. Store the full selected option, not only a role ID/name.

## 7. Roadmap Generation/Provenance Findings

Status: **needs_change (P0)**.

Current payload in `roadmapService.generateAIRoadmap` includes:

```ts
{
  forceRegenerate,
  roleId,
  selectedRole: { roleId, roleName },
  targetRole,
  sourceMode,
  repoId?,
  repoIds?
}
```

It does not send `currentRepositoryId`, `selectedRoleId`, `sourceRepositoryId`, `sourceAnalysisId`, or `sourceSnapshotId`. It also accepts `selected_repos` and `all_analyzed_repos`, hard-codes role ID/name fallbacks, and calls portfolio options as a multi-repository source.

After the response, the service locally enriches `roadmapSource` with `sourceMode`, counts, and repository IDs. That is unsafe for provenance: server-returned provenance must be authoritative and must not be synthesized into something that looks verified.

Positive compatibility:

- `Roadmap` already exposes `roleId`, `requestedLevel`, `effectiveLevel`, and `roadmapSource`.
- `RoadmapDetailPage` displays effective level and a source card.

Missing provenance fields include selected role, role selection type, source analysis/snapshot, model/pipeline versions, and evidence fingerprint. The page copy still describes selected/all repos as one personalization basis, which conflicts with per-repository Dev2Vec authority.

## 8. Snapshot/Comparison Findings

Status: **needs_change (P0)**.

- `snapshotApi` implements all four required endpoints and normalizes heterogeneous legacy response shapes.
- `AnalysisSnapshot`/normalization does not retain `modelVersion`, `pipelineVersion`, document/evidence versions, `isCurrentVersion`, `isCompatible`, or `isComparableWithCurrent`.
- `RepositoryProgressPage` labels snapshots by time/id only; it shows no version/legacy badge.
- Both comparison selectors contain every snapshot. The button is disabled only when IDs are equal.
- Manual comparison catches a generic message; it does not inspect HTTP 409 `comparisonStatus`/`errors` and therefore cannot suppress delta charts with the required version warning.
- Automatic comparison uses `.catch(() => null)`. This swallows `insufficient_compatible_snapshots`; the page then derives visuals from first/latest snapshots, an invalid legacy fallback under v12.

The exact comparison screen is `src/app/pages/progress/RepositoryProgressPage.tsx`; charts and selectors are inline rather than separate components.

## 9. Dashboard Findings

Status: **needs_change (P0)**.

`DashboardPage` calls `dashboardApi.me()` but also calls `fetchRepositories()` and `fetchMyAnalyses()`, then builds `analysisOverview` client-side. Its overall score falls back to `analyses[0]?.scores.overall`; career directions/languages/frameworks/missing skills are rendered from the client aggregation.

The page does not read `dev2vecStatus`, model/pipeline versions, `currentSnapshot`, or `currentFeedback`. Consequently an `analysis_required` user can still see legacy career direction and summary as current. Keep `/dashboard/me` authoritative for current Dev2Vec state and only use legacy/history data in explicitly historical sections.

## 10. Feedback Findings

Status: **needs_change (P1)**.

- Endpoint coverage is complete in `aiFeedbackApi`.
- `AIFeedback` and `normalizeFeedback` do not retain `isStale`, `staleReason`, source/current model/pipeline versions.
- `RepositoryDetailPage` renders any cached feedback normally and blocks generation only with a generic “need analysis” message.
- Generate errors are normalized to a string; typed conflicts `analysis_required`/`incompatible_analysis_history` are not actionable states.
- No automatic infinite retry was found, which is good. The gap is routing the typed conflict to an analysis CTA and rendering stale badge + regenerate CTA.

## 11. Chat Findings

Status: **partially_compatible (P1)**.

- `chatApi`, `chatStore`, and realtime merging are centralized and preserve existing sessions/messages.
- `ChatPage` creates a session with a single `repositoryId`; normal send calls `sendMessage(message)` without comparison IDs.
- Types/normalizers do not preserve `contextSources` or `dev2vecAuthoritative`, so the UI cannot label answer authority.
- There is no explicit comparison flow supporting 2-5 `repositoryIds`; repository names in prose cannot be authoritative selection.
- Existing copy says chat uses repository/analysis/GitHub context but does not claim a merged vector. Technical package data is not visibly labeled as non-skill evidence.

## 12. Learning/Progress Findings

Status: **compatible**, with localized risks.

- Learning remains item-based: roadmap list -> `RoadmapTree` -> each `LearningNode` -> `/roadmaps/:id/learning/items/:itemId`.
- `RoadmapDetailPage` fetches learning availability once when the normalized roadmap ID becomes available and overlays `learningStatus` by `itemId`.
- `SkillLearningDetailPage` loads/generates item content through `learningStore`; generation explicitly includes resources.
- YouTube and other external resources are `learning.resources`. They are rendered in `SkillLearningDetailPage` as external anchors with `target="_blank" rel="noreferrer"`; `thumbnailUrl` has a styled placeholder when falsy.
- Progress updates originate from `LearningNode` or the detail completion action -> `roadmapStore.updateNodeStatus` -> `roadmapService.updateRoadmapProgress`. Reset is page action -> POST reset.
- Roadmap learning progress and repository snapshot comparison are in distinct services/pages/types and are not currently merged.

Risks to retain during migration: legacy `/skills/:skillName` route still exists; learning store performs one automatic generation when content is missing; status mapping is client-side. None should be changed for Coursera.

## 13. Coursera Findings

Status: **missing (P1)**.

No endpoint, type, store action, component, URL validator, or Coursera-specific assets exist.

Exact integration point:

- Route and screen: `/roadmaps/:id` -> `RoadmapDetailPage`.
- ID source: `const { id } = useParams()`; after roadmap resolution use `roadmap.id` (the normalized backend ID).
- Render position: immediately after the closing `</Tabs>` at current `RoadmapDetailPage.tsx:521` and before the main content container closes at line 522. This is outside `RoadmapTree`, `modules.map`, `nodes.map`, every phase, and the learning-item page.
- Proposed contract: `<CourseraRecommendationSection roadmapId={roadmap.id} />`.
- Lifecycle: fetch once per `roadmapId` in a dedicated Zustand slice/store action or section-local effect with an `AbortController`/mounted guard and per-ID cache. Start after the valid roadmap ID exists, in parallel with learning. Do not refetch on progress changes or card renders.

Recommended files:

- Types: `src/features/roadmaps/types/courseRecommendations.ts` (or additive exports in `types/index.ts`).
- API: `src/features/roadmaps/services/courseRecommendationService.ts`, using `apiClient` + `unwrapResponse`.
- State: `src/features/roadmaps/stores/courseRecommendationStore.ts` (consistent with current architecture) or a section-local finite state hook; no new dependency.
- Component: `src/features/roadmaps/components/CourseraRecommendationSection.tsx`.
- URL helper: `src/features/roadmaps/utils/courseraUrl.ts`.
- Screen: one render line in `RoadmapDetailPage.tsx` after Tabs.

Behavior: section-only skeleton; `courses: []` is success and may show a light empty state; finite/manual retry; errors never replace roadmap page. Use a CSS/inline placeholder when `thumbnailUrl === ""`. Validate `https:` and exact hostname `coursera.org` or `www.coursera.org`, then open with `window.open(url, '_blank', 'noopener,noreferrer')`. Never build/search a URL. Coursera does not update progress.

## 14. Types/DTO Findings

| Type | File | Missing fields | Risk | Proposed change |
|---|---|---|---|---|
| `AnalysisResult` | `src/app/types/index.ts` | status, reason, compatibility, versions, IDs | Typed state rendered as current/empty | Add optional metadata; model typed-state union at API result |
| `RoleMatch` / `RepositoryRoleMatches` | same | source IDs/name, selectionType, primary/additional selection, aggregation metadata | Wrong role semantics/provenance loss | Add `RoleOption`, `RoleSelection`; retain old fields |
| `RoadmapSource` | roadmap types | selectedRoleId, roleSelectionType, source analysis/snapshot, versions, fingerprint | Cannot display/debug provenance | Add optional fields only |
| `AnalysisSnapshot` | `snapshotApi.ts` | versions and comparability flags | Cross-version compare | Add optional compatibility fields and normalize |
| `SnapshotComparison` | `snapshotApi.ts` | comparisonStatus/version/errors | Typed 409 becomes generic | Add discriminated status fields |
| Dashboard payload | currently `Record<string, unknown>` | `dev2vecStatus`, current typed entities | Legacy fallback silently wins | Introduce explicit DTO and state union |
| `AIFeedback` | app types | stale/version fields | Stale feedback shown current | Add optional freshness fields |
| Chat message/session/response | app types | contextSources, dev2vecAuthoritative, repositoryIds | No authority/comparison transparency | Add optional metadata and send payload IDs |
| Learning types | `learningApi.ts`, roadmap types | none for v12 | Duplicate `LearningResource` names can confuse imports | Keep contracts; avoid Coursera reuse |
| Coursera types | absent | all guide fields | Feature cannot compile | Add three dedicated interfaces; do not reuse `LearningResource` |

There is no shared `ApiResponse<T>` type. Runtime convention is Axios `response.data` followed by `unwrapResponse<T>` (one `data` or `result` layer) or `extractApiResource`. Coursera response therefore needs `unwrapResponse<RoadmapCourseRecommendationsData>(response.data)`, not a blind cast of the Axios response.

## 15. Hard-coded Legacy Findings

- `roadmapTargetRoles` and `roadmapService` contain fixed role names/ID mappings (`backend`, `frontend`, etc.) used to authorize/generate a roadmap rather than using backend role options.
- `RoadmapsPage` exposes `single_repo`, `selected_repos`, and `all_analyzed_repos`; copy and service behavior model old multi-repo personalization.
- `roleMatchApi` hard-codes `limit: 3`, while `RoleMatchPanel` renders up to three matches as a single inference list.
- `roadmapService` synthesizes `roadmapSource` and source counts after generation.
- `DashboardPage` uses `analyses[0]` and aggregates career directions across analyses without compatibility filtering.
- `RepositoryProgressPage` assumes chronological first/latest snapshots can produce progress visuals and offers all pairs.
- No literal `dev2vec-demo-v1/v2/v3`, pipeline v10/v11, or “merged vector” string was found in production source. The problem is behavioral/copy semantics, not version-string hard-coding.

## 16. Exact Files to Modify

### P0 critical

- `src/app/types/index.ts`: compatibility, role option/selection, feedback, chat metadata.
- `src/app/services/apis/normalizerParts/analysis.ts` and `normalizers/index.ts`: preserve typed analysis states/metadata.
- `src/app/services/apis/analysisApi.ts`: return an analysis-result state union.
- `src/app/stores/repositoryStore.ts`: store per-repository analysis state and typed errors.
- `src/app/pages/analysis/AnalysisResultPage.tsx` and `src/app/pages/repositories/RepositoryDetailPage.tsx`: transition states and CTA.
- `src/app/components/analysis/RoleMatchPanel.tsx`: primary/additional role sections and selection event.
- `src/app/services/apis/roleMatchApi.ts`: new DTOs; stop imposing top-3 semantics.
- `src/features/roadmaps/pages/RoadmapsPage.tsx`: select backend `RoleOption`, remove arbitrary authoritative role selection.
- `src/features/roadmaps/services/roadmapService.ts`: provenance request and removal of synthesized authoritative source.
- `src/features/roadmaps/types/index.ts`: expanded `RoadmapSource`.
- `src/app/services/apis/snapshotApi.ts` and `src/app/pages/progress/RepositoryProgressPage.tsx`: compatibility metadata and typed comparison states.
- `src/app/pages/dashboard/DashboardPage.tsx` and `src/app/services/apis/dashboardApi.ts`: typed `dev2vecStatus`, authoritative dashboard rendering.

### P1 required

- `src/app/services/apis/aiFeedbackApi.ts`, `src/app/stores/repositoryStore.ts`, `RepositoryDetailPage.tsx`: typed conflicts and stale feedback.
- `src/app/services/apis/chatApi.ts`, `src/app/stores/chatStore.ts`, `src/app/pages/chat/ChatPage.tsx`: `repositoryIds` and context metadata.
- `src/features/roadmaps/types/courseRecommendations.ts` (new).
- `src/features/roadmaps/services/courseRecommendationService.ts` (new).
- `src/features/roadmaps/stores/courseRecommendationStore.ts` (new, if store chosen).
- `src/features/roadmaps/utils/courseraUrl.ts` (new).
- `src/features/roadmaps/components/CourseraRecommendationSection.tsx` (new).
- `src/features/roadmaps/pages/RoadmapDetailPage.tsx`: render section after Tabs.

### P2 optional/cleanup

- Extract snapshot comparison UI into components after behavior is correct.
- Consolidate duplicate learning resource names without altering contracts.
- Add version/status presentation to relevant admin pages.
- Move the guide to the documented `docs/` path once its untracked ownership is confirmed.

## 17. Proposed Implementation Sequence

1. Add additive Dev2Vec version/compatibility/state DTOs and tests for unwrap/normalizers.
2. Change analysis APIs/store/pages to distinguish `available`, `analysis_required`, and incompatible history.
3. Model `RoleOption`/`RoleSelection`, render primary vs portfolio options, persist full selected option.
4. Update roadmap request provenance and render only server-returned roadmap source; retain old request fallback only where explicitly needed.
5. Add snapshot version metadata, disable incompatible pairs, and implement typed 409/insufficient states without legacy fallback.
6. Make `/dashboard/me` authoritative for current state; then add feedback freshness and chat context/comparison IDs.
7. Add the isolated roadmap-level Coursera service/store/component and URL validator.
8. Run regression tests for unchanged learning, YouTube resources, and roadmap progress; add end-to-end flow tests.

## 18. Risks

- Wrong unwrap level can turn `{success,data}` into an envelope instead of course/typed data.
- Backward-compatible old fields can tempt UI code to fall back to legacy data during an explicit v12 typed state.
- Keeping both hard-coded roles and server options can allow an unauthorized provenance path.
- Locally enriching `roadmapSource` can falsely present unverified provenance.
- Swallowing comparison errors with `.catch(() => null)` can render misleading deltas.
- Zustand lacks query invalidation/deduplication by default; effects need per-key guards/cache and bounded retry.
- Axios calls generally do not pass cancellation signals. Existing mounted flags prevent set-state but do not cancel network work.
- Global store `error` fields are shared across operations and can make one feature's error appear in another section.
- `thumbnailUrl: ""` must not be passed as an image source; loading errors also need an on-error fallback.
- External anchors are not domain-restricted; Coursera needs stricter validation than current learning resources.
- No test framework is configured in `package.json`, so the migration must first select/configure a test runner (prefer the project-approved runner, not an audit-time dependency).

## 19. Test Plan

- Unit: unwrap envelopes with `data`/`result`; preserve typed analysis states and optional versions.
- Unit: normalize old and v12 role-match payloads without conflating primary/additional options.
- Unit: build roadmap request from primary and portfolio role options; assert all provenance IDs and no arbitrary catalog role.
- Unit: snapshot normalizer/comparability; error parser for HTTP 409 and insufficient state.
- Unit: dashboard `current` vs `analysis_required`; stale feedback metadata; chat context sources.
- Unit: `isAllowedCourseraUrl` accepts only HTTPS exact Coursera hosts and rejects HTTP, subdomain spoofing, credentials, malformed URLs.
- Component: analysis CTA states; primary/portfolio role labels; stale badge; snapshot disabled options/version warning.
- Component: Coursera loading, courses, empty success, inline error/manual retry, blank/broken thumbnail, invalid URL disabled.
- Integration: route ID -> roadmap fetch -> learning fetch -> exactly one Coursera fetch per roadmap ID.
- Regression: learning item navigation, YouTube anchors, completion PATCH, reset POST, archive/delete, return-scroll restoration.
- E2E: repository analysis -> role selection -> provenance roadmap -> learning; v11-only user transition; mixed-version snapshots; chat comparison with 2-5 explicit IDs.

## 20. Definition of Done

- Backend typed states, not timestamps/array order, determine current analysis.
- Primary and portfolio roles have distinct UI and retained source provenance.
- Roadmap generation sends current repository and selected-role provenance; arbitrary catalog roles cannot create authoritative roadmaps.
- Roadmap source displayed to the user comes from backend response.
- Snapshot history shows versions; incompatible comparisons are disabled and typed states never render delta charts.
- Dashboard, feedback, and chat consume v12 metadata correctly.
- Existing learning, YouTube, and roadmap progress behavior remains unchanged.
- Coursera is fetched once per roadmap, rendered after the entire roadmap detail, validates URLs, and never affects progress.
- All P0/P1 tests pass and no legacy current-state fallback remains.

