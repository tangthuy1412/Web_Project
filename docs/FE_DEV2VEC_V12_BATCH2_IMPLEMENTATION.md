# FE Dev2Vec v12 Migration — Batch 2 Implementation

## Phạm vi đã triển khai

Batch 2 chuyển roadmap generation sang dùng `RoleOption` do repository analysis/role-matching API trả về. Catalog, hằng role và text nhập tay không còn được dùng để dựng role authority hoặc provenance. Các luồng learning, YouTube, progress, snapshot, dashboard, feedback, chat và Coursera không thay đổi.

## Authoritative role selection

Nguồn hợp lệ gồm primary role của repository hiện tại, `additionalRoleOptions` tường minh và portfolio options từ role-matching API. Full `RoleOption` được giữ qua `RoleMatchPanel` → `repositoryStore` → navigation state → `RoadmapsPage` → mutation.

`RoadmapsPage` ưu tiên navigation state. Primary option trong store chỉ được tái sử dụng khi `sourceRepositoryId` khớp repository hiện tại; nếu không có authority hợp lệ, nút generate bị vô hiệu hóa và người dùng phải tải lại role từ analysis. Khi đổi source context, option cũ không được dùng cho repository mới.

## Request DTO trước và sau

Trước Batch 2, generation có thể nhận role text/local role ID, `repoIds`, `selected_repos` hoặc `all_analyzed_repos`, rồi client bổ sung metadata nguồn vào response.

Sau Batch 2, `buildRoadmapGenerationPayload` chỉ nhận:

```ts
{
  currentRepositoryId: string
  selectedRoleOption: RoleOption
  level?: string
  durationWeeks?: number
  language?: string
  useRoleMatching?: boolean
  forceRegenerate?: boolean
}
```

Builder trim identity, từ chối repository/role identity rỗng, bỏ optional provenance bị thiếu và không tạo ID giả. Payload generation luôn có `sourceMode: "single_repo"`; không gửi `repoIds`.

### Primary role payload

```json
{
  "repoId": "repo-current",
  "currentRepositoryId": "repo-current",
  "selectedRoleId": "frontend",
  "sourceRepositoryId": "repo-current",
  "sourceAnalysisId": "analysis-1",
  "sourceSnapshotId": "snapshot-1",
  "targetRole": "Frontend Developer",
  "roleId": "frontend",
  "level": "beginner",
  "durationWeeks": 6,
  "language": "vi",
  "useRoleMatching": true,
  "forceRegenerate": false,
  "sourceMode": "single_repo"
}
```

### Portfolio role payload

```json
{
  "repoId": "repo-current",
  "currentRepositoryId": "repo-current",
  "selectedRoleId": "backend",
  "sourceRepositoryId": "repo-portfolio-source",
  "sourceAnalysisId": "analysis-portfolio",
  "sourceSnapshotId": "snapshot-portfolio",
  "targetRole": "Backend Developer",
  "roleId": "backend",
  "level": "beginner",
  "durationWeeks": 6,
  "language": "vi",
  "useRoleMatching": true,
  "forceRegenerate": false,
  "sourceMode": "single_repo"
}
```

`sourceRepositoryId` luôn đến từ selected option và không bị overwrite bởi current repository.

## Legacy fallback

Service vẫn nhận `repoId` hoặc positional `legacyRepoId` làm fallback cho `currentRepositoryId`. Fallback chỉ chạy khi caller đồng thời có full authoritative `selectedRoleOption`; service không dựng option từ catalog, target-role string hoặc constants. Deep link/refresh không crash: nếu thiếu option, generation bị chặn và UI yêu cầu quay lại analysis/chọn role.

## Multi-repository semantics

UI portfolio có thể tiếp tục lấy/dàn các role options từ nhiều repository để người dùng lựa chọn. Copy đã đổi sang “Vai trò chính từ repository hiện tại” và “Vai trò khác từ repository đã phân tích”. Đây không được mô tả là vector merge hay classifier inference tổng hợp. Mutation cuối cùng luôn dùng đúng một `RoleOption` và một current repository.

## Server `roadmapSource` và provenance UI

`normalizeBackendRoadmap` giữ `roadmapSource` server trả về, không attach local selected role, không sinh analysis/snapshot IDs, không tính lại selection type và không bổ sung repository count như provenance đã xác minh.

`RoadmapSource` được mở rộng additive/optional với selected-role, current/source repository, model/pipeline và evidence fields để roadmap cũ vẫn render. Detail page ưu tiên server data và hiển thị role, source repository, loại lựa chọn, requested/effective level và pipeline. Analysis/snapshot/evidence IDs không hiện cho người dùng thường. Roadmap cũ thiếu provenance hiển thị thông báo không có nguồn chi tiết thay vì label suy đoán.

`requestedLevel` và `effectiveLevel` được hiển thị riêng; frontend không tự suy ra hoặc overwrite effective level.

## Error và mutation lifecycle

- Missing RoleOption, role identity hoặc repository identity không tạo request.
- Loading state chặn double submit.
- HTTP 409/stale-role conflict có thông báo tải lại kết quả phân tích vai trò.
- Network/server errors vẫn đi qua error mapping hiện có.
- Roadmap response từ server là source of truth sau mutation.

## Files changed

- `src/app/types/index.ts`
- `src/app/stores/repositoryStore.ts`
- `src/app/components/analysis/RoleMatchPanel.tsx`
- `src/app/pages/analysis/AnalysisResultPage.tsx`
- `src/app/pages/repositories/RepositoryDetailPage.tsx`
- `src/app/services/apis/analysisApi.ts`
- `src/app/services/apis/normalizerParts/analysis.ts`
- `src/app/services/apis/roleMatchApi.ts`
- `src/features/roadmaps/types/index.ts`
- `src/features/roadmaps/pages/RoadmapsPage.tsx`
- `src/features/roadmaps/pages/RoadmapDetailPage.tsx`
- `src/features/roadmaps/services/roadmapService.ts`
- `src/features/roadmaps/stores/roadmapStore.ts`

Một số file trong danh sách là nền tảng RoleOption đã triển khai ở Batch 1 và được Batch 2 tái sử dụng.

## Verification

- Code inspection: primary và portfolio giữ đúng current/source repository.
- Code inspection: optional provenance rỗng bị loại khỏi DTO.
- Code inspection: generation DTO không còn `repoIds`, `selected_repos` hoặc `all_analyzed_repos`.
- Code inspection: catalog/static role không thể tạo authoritative payload.
- Code inspection: server `roadmapSource` không bị enrich bằng local selection.
- Code inspection: legacy roadmap, requested/effective level và loading guard vẫn hoạt động.
- `npm run build`: pass (Vite production build). Có warning chunk > 500 kB đã tồn tại, không phải lỗi Batch 2.

## Remaining Batch 3

Snapshot list/comparison, progress comparison, dashboard migration, feedback freshness, chat comparison metadata và các contract tiếp theo vẫn để Batch 3. Coursera không nằm trong Batch 2.
