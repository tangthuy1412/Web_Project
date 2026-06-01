# GitAnalyzer AI

Ứng dụng React + TypeScript dùng Vite, TailwindCSS và React Router để xây dựng nền tảng phân tích repository GitHub, AI Mentor và lộ trình học cá nhân hóa.

## Scripts

```bash
npm run dev
npm run build
```

## Cấu trúc chính

```text
src/
  app/
    App.tsx              # Router provider
    routes.tsx           # Khai báo route toàn ứng dụng
    components/
      layout/            # Sidebar, topbar cho app dashboard
      ui/                # Component UI dùng chung
    hooks/               # Hook dùng chung
    layouts/             # Layout auth và dashboard
    lib/                 # Helper dùng chung
    mock/                # Dữ liệu mẫu cho app chính
    pages/               # Các màn hình chính
      landing/           # Landing page public
      auth/
      dashboard/
      repositories/
      analysis/
      chat/
      github/
      progress/
      settings/
    stores/              # Zustand stores
    types/               # Type dùng chung
  features/
    roadmaps/            # Feature module cho learning roadmap
      components/
      hooks/
      mock/
      pages/
      services/
      stores/
      types/
      utils/
  styles/                # Tailwind và theme tokens
  main.tsx               # Entry point
```

## Quy ước

- `app/` chứa shell, route, layout, page và logic dùng chung.
- `features/` chứa các domain module có đủ component, store, service, type và mock riêng.
- Không đặt file template Vite hoặc asset không dùng ở root `src/`.
- Dữ liệu mock chỉ dùng cho demo UI, không trộn vào component nếu có thể tách ra store/service.
