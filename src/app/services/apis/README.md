# API flow layout

Import API clients by feature flow when adding new code:

- `apis/core`: shared API client, error helpers, health and dashboard.
- `apis/auth`: login, register, OAuth user/profile flow.
- `apis/github`: GitHub OAuth and repository sync endpoints.
- `apis/repositories`: repository detail, package/commit cache, analysis, AI feedback and reports.
- `apis/analysis`: analysis result, role match and AI feedback endpoints.
- `apis/progress`: repository snapshot history and comparison endpoints.
- `apis/notifications`: notification list/read/delete endpoints.
- `apis/chat`: AI mentor chat endpoints and normalizers.
- `apis/learning`: learning content endpoints used by roadmap screens.
- `apis/admin`: all admin-only endpoints and admin response types.
- `apis/scaffolds`: project scaffold generation endpoints.
- `apis/normalizers`: shared response normalizers.

The legacy files in this folder are kept as stable compatibility entry points. Prefer the flow folders above for new imports.
