# FE Dev2Vec v12 Migration Batch 4: Coursera Implementation

## 1. Integration point

`CourseraRecommendationSection` được render đúng một lần trong `RoadmapDetailPage`, ngay sau toàn bộ `Tabs` và trước closing page container. Section nằm ngoài `RoadmapTree`, phase/task/node loops và learning item UI.

Coursera là recommendation cho toàn roadmap. Luồng chính roadmap item → learning content → YouTube → progress không thay đổi.

## 2. API service và unwrap behavior

`courseRecommendationService.getForRoadmap(roadmapId)`:

- trim và validate ID trước request;
- gọi `GET /roadmaps/{roadmapId}/course-recommendations` qua `apiClient` hiện có;
- không thêm `/api` vào path;
- giữ auth/401 interceptor hiện có;
- dùng `unwrapResponse` rồi normalize topic/courses;
- không tạo request với ID rỗng hoặc `undefined`;
- malformed/non-Coursera course entry không làm crash section.

## 3. Types

Types Coursera nằm riêng tại `types/courseRecommendations.ts`:

- `CourseraCourseRecommendation`
- `RoadmapCourseRecommendationTopic`
- `RoadmapCourseRecommendationsData`

Không reuse hoặc thay đổi `LearningResource`/YouTube DTO.

## 4. Store lifecycle và cache

`courseRecommendationStore` dùng `entriesByRoadmapId`, mỗi roadmap có `idle | loading | success | error` riêng.

- Request loading được dedupe bằng in-flight map keyed theo roadmap ID.
- Success được cache và không tự refetch.
- Retry chỉ force reload entry hiện tại.
- Response roadmap A chỉ ghi entry A, không overwrite roadmap B.
- Progress, archive, tab hoặc learning state không nằm trong dependency fetch.
- Zustand store tránh component-unmount state warnings.
- Error chỉ ảnh hưởng section Coursera.

## 5. Component states

- Loading: skeleton riêng, có accessible status và không block roadmap.
- Success: responsive course grid.
- Empty `courses: []`: success hợp lệ với copy “Chưa có khóa học Coursera phù hợp.”
- Error/404/network/5xx: inline message và manual retry hữu hạn.
- Không tự mở course và không tự retry.

## 6. Course card fields

Card hiển thị thumbnail/placeholder, title, partner, content type, course level, duration, language, description và external CTA. Topic level không được dùng thay course level.

Known content types được chuyển từ snake_case thành readable title case; unknown strings cũng được format an toàn.

## 7. URL security

`isAllowedCourseraUrl` chỉ chấp nhận:

- protocol `https:`;
- hostname chính xác `coursera.org` hoặc `www.coursera.org`.

HTTP, malformed URL, `javascript:`, `data:`, subdomain ngoài allowlist và spoof hostname đều bị chặn. CTA invalid bị disable; frontend không sửa URL, search theo title hoặc dựng link thay thế. URL hợp lệ mở bằng `_blank` với `noopener,noreferrer`.

## 8. Thumbnail fallback

`thumbnailUrl` rỗng không được truyền vào `img`. Placeholder giữ aspect ratio 16:9. Image load error chuyển sang placeholder mà không block nội dung card. Image hợp lệ dùng lazy loading và alt theo course title.

## 9. Accessibility và responsive behavior

- Section có `aria-labelledby` và semantic heading.
- Mỗi course dùng semantic `article`/`h3`.
- CTA có accessible name bao gồm course title và external-link icon ẩn khỏi screen reader.
- Loading, empty và error có live-readable status/alert semantics.
- Mobile một cột, tablet hai cột, desktop lớn ba cột.
- CTA nằm cuối card và không wrap ở desktop.
- Light/dark styling, focus và Button behavior tái sử dụng design system hiện có.

## 10. Files changed

Tạo mới:

- `src/features/roadmaps/types/courseRecommendations.ts`
- `src/features/roadmaps/services/courseRecommendationService.ts`
- `src/features/roadmaps/stores/courseRecommendationStore.ts`
- `src/features/roadmaps/components/CourseraRecommendationSection.tsx`
- `src/features/roadmaps/utils/courseraUrl.ts`
- `docs/FE_DEV2VEC_V12_BATCH4_COURSERA_IMPLEMENTATION.md`

Chỉnh sửa:

- `src/features/roadmaps/types/index.ts`
- `src/features/roadmaps/pages/RoadmapDetailPage.tsx`

Project không có barrel files cho roadmap services/stores/components nên không tạo barrel mới chỉ cho Batch 4.

## 11. Build và manual verification

- Endpoint chỉ được gọi từ section effect theo valid roadmap ID.
- Section không nằm trong item/task loop.
- Cached success và in-flight dedupe ngăn duplicate fetch.
- Empty/error/loading đều local.
- Empty/broken thumbnail có fallback.
- Course level độc lập topic level.
- Coursera HTTPS allowlist được kiểm tra trước `window.open`.
- Click course không gọi progress mutation.
- Navigation A → B dùng keyed entry tương ứng.
- `npm run build`: pass.
- `git diff --check`: pass.

Vite vẫn báo warning chunk JavaScript lớn hơn 500 kB; đây là warning tồn tại ngoài phạm vi Batch 4.

## 12. Regression confirmation

Batch 4 không thay đổi roadmap generation/RoleOption/provenance, snapshot comparison, dashboard, feedback, chat, learning, YouTube, roadmap progress, routes, API client architecture hoặc dependency stack. Batch 1–3 tiếp tục build thành công.
