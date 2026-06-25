# Frontend structure

This app uses a flow-first structure for user-facing features and API integration.

## Top-level folders

- `app/`: shared application shell, routes, layouts, shared UI, global stores and app-wide pages.
- `features/`: larger self-contained product areas. Roadmaps live here because they have their own pages, stores, services, types and components.
- `styles/`: global styling assets.

## Page placement

Pages are grouped by route or business flow:

- `app/pages/repositories`: repository list/detail and repository actions.
- `app/pages/analysis`: repository analysis result screens.
- `app/pages/progress`: snapshot history and progress comparison.
- `app/pages/notifications`: notification center.
- `app/pages/admin`: admin-only management screens.
- `features/roadmaps/pages`: roadmap-specific user screens.

If a flow grows beyond one or two pages and needs its own store/service/types, move it to `features/<flow>`.

## API placement

Prefer importing API clients through flow folders:

- `app/services/apis/core`
- `app/services/apis/auth`
- `app/services/apis/github`
- `app/services/apis/repositories`
- `app/services/apis/analysis`
- `app/services/apis/progress`
- `app/services/apis/notifications`
- `app/services/apis/chat`
- `app/services/apis/learning`
- `app/services/apis/admin`
- `app/services/apis/scaffolds`

The older single files such as `githubApi.ts`, `analysisApi.ts` and `adminApi.ts` stay as compatibility entry points and implementation files. New code should import from a flow folder, for example:

```ts
import { githubApi } from '../../services/apis/github'
import { snapshotApi } from '../../services/apis/progress'
import { adminApi } from '../../services/apis/admin'
```

## Naming

- API files and flow folders should follow backend resource names where possible: `repositories`, `analysis`, `progress`, `notifications`, `admin`.
- Stores should describe client state ownership: `repositoryStore`, `chatStore`, `roadmapStore`.
- UI components that are shared across flows stay in `app/components`; flow-specific components stay inside `features/<flow>/components`.

## Maintenance rule

Keep data shaping near the API boundary. When an API response has nested fields or inconsistent names, normalize it in `app/services/apis/normalizerParts` or the API implementation file before it reaches pages.
