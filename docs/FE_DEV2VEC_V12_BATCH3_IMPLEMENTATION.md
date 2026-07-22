# FE Dev2Vec v12 Migration — Batch 3 Implementation

## 1. Snapshot compatibility types

`AnalysisSnapshot` giữ additive metadata `modelVersion`, `pipelineVersion`, các document/evidence versions, `isCurrentVersion`, `isCompatible` và `isComparableWithCurrent`. Snapshot cũ vẫn normalize và hiển thị khi các field này vắng mặt.

`SnapshotComparison` có `comparisonStatus: "comparable"` và optional `comparisonVersion`. `SnapshotComparisonState` biểu diễn riêng `incompatible_snapshot_versions`; `RepositoryProgressComparisonState` biểu diễn `comparable` hoặc `insufficient_compatible_snapshots`.

## 2. Snapshot list/detail behavior

History không lọc snapshot legacy. UI hiển thị pipeline, phiên bản hiện tại/cũ và trạng thái không thể so sánh. Mỗi snapshot vẫn có thể gọi detail endpoint độc lập. Quyết định current/comparable dựa trên metadata server, không dựa trên timestamp hoặc list order.

## 3. Manual comparison

Selector disable snapshot server đánh dấu non-compatible/non-comparable, snapshot trùng với phía còn lại và pair khác model/pipeline generation. Khi đổi pair, result/chart cũ bị clear.

HTTP 409 `incompatible_snapshot_versions` được map thành domain state, không thành network error. UI không render delta và hiển thị “Không thể so sánh snapshot khác phiên bản”. Không có local comparison fallback.

## 4. Automatic progress comparison

`GET /repositories/{repoId}/progress-comparison` trả typed union. `insufficient_compatible_snapshots` hiển thị yêu cầu ít nhất hai snapshot tương thích và CTA phân tích lại repository. Frontend không còn `.catch(() => null)` rồi lấy first/latest snapshot để tự dựng delta.

Request sequence guards ngăn response của repository/pair cũ ghi đè state mới. Đổi repository clear snapshots, baseline, manual result và selectors; đổi pair hủy authority của request comparison đang chạy.

## 5. Dashboard migration

`dashboardApi.me()` trả explicit `DashboardResponse` với `dev2vecStatus`, model/pipeline, `topRoles`, `currentSnapshot`, `currentFeedback` và dashboard counters.

Với `current`, overall score và role/current metadata lấy từ dashboard contract. Không dùng `analyses[0]`, list order hoặc client aggregate để tạo current score. Với `analysis_required`, current state bị ẩn và CTA phân tích repository được hiển thị. Danh sách analysis hiện có chỉ mang ý nghĩa lịch sử.

## 6. Feedback freshness

`AIFeedback` giữ `isStale`, `staleReason`, source/current model và pipeline versions, kể cả khi backend đặt chúng trong object `freshness`.

Feedback stale vẫn xem được nhưng có badge “Feedback cũ”, lý do stale và CTA “Tạo lại feedback”. Generate không dừng ở cached stale result. Conflict `analysis_required`/`incompatible_analysis_history` được map thành hướng dẫn phân tích lại repository và không có retry loop.

## 7. Chat context/comparison

Chat types và normalizers giữ optional `contextSources`, `dev2vecAuthoritative` và `repositoryIds`. Store giữ metadata response trong session context.

ChatPage có additive comparison mode. User chọn 2–5 analyzed repositories; IDs được trim, loại trùng, loại rỗng và gửi explicit `{ repositoryIds }`. Single-repository chat cũ không đổi. Selection reset khi đổi session. Copy xác nhận comparison không phải merged vector inference.

Context labels phân biệt authoritative Dev2Vec, verified contribution và technical repository context. Technical context chỉ được mô tả là thông tin kỹ thuật, không phải bằng chứng chắc chắn về skill cá nhân.

## 8. Error mapping

- `incompatible_snapshot_versions`: typed state, clear delta result.
- `insufficient_compatible_snapshots`: typed automatic-progress state.
- `analysis_required` và `incompatible_analysis_history`: feedback re-analysis guidance.
- Các network/server errors khác tiếp tục dùng API error message hiện có.

## 9. Lifecycle protections

- Repository change clear comparison/current snapshot UI trước khi load.
- Pair change clear manual comparison và vô hiệu hóa request pair cũ.
- Incompatible response không giữ chart cũ.
- Dashboard không lấy legacy data làm current trong lúc load hoặc `analysis_required`.
- Chat comparison IDs reset khi session thay đổi.
- Loading states chặn comparison/feedback/chat double submit.

## 10. Files changed

- `src/app/types/index.ts`
- `src/app/services/apis/snapshotApi.ts`
- `src/app/pages/progress/RepositoryProgressPage.tsx`
- `src/app/services/apis/dashboardApi.ts`
- `src/app/pages/dashboard/DashboardPage.tsx`
- `src/app/stores/repositoryStore.ts`
- `src/app/pages/repositories/RepositoryDetailPage.tsx`
- `src/app/services/apis/normalizerParts/chat.ts`
- `src/app/stores/chatStore.ts`
- `src/app/pages/chat/ChatPage.tsx`

## 11. Verification

- Snapshot metadata and legacy detail: inspected.
- Same/non-comparable/cross-generation pair guards: inspected.
- Typed 409 and insufficient states do not render delta: inspected.
- No automatic first/latest delta fallback: inspected.
- Dashboard has no `analyses[0]` current fallback: inspected.
- Feedback stale badge/regeneration and conflict mapping: inspected.
- Chat single repo plus explicit deduplicated 2–5 repo payload: inspected.
- Batch 2 roadmap generation, learning, YouTube and roadmap progress files were not changed by Batch 3.
- `npm run build`: pass.
- `git diff --check`: pass.

The existing Vite warning for a JavaScript chunk larger than 500 kB remains non-blocking.

## 12. Remaining Batch 4

Coursera course recommendations/integration remain intentionally out of scope and are the principal Batch 4 work.
