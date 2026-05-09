# SIAB Registry

The SIAB design system as a shadcn registry. Powers siab-payload and future SIAB apps.

## What's in v1

- **3 foundation items** — `theme` (OKLch tokens, Poppins, light + dark), `base` (Tailwind v4 config + `tw-animate-css` + `@layer base`), `utils` (`cn()` helper)
- **46 UI primitives** — full shadcn New-York catalog. 3 carry SIAB customizations (button, avatar, input).
- **8 shared patterns** — empty-state, confirm-dialog, typed-confirm-dialog, sticky-form-footer, data-table, page-header, theme-toggle, theme-provider

Total: **57 items**.

## Source layout

```
packages/siab/
├── components.json           ← shadcn config for this package
├── registry.json             ← item index
├── tsconfig.json
└── registry/default/         ← .tsx/.ts source files
```

Built output goes to `../../public/r/v1/siab/*.json` (consolidated at the monorepo root).

## Build

From the monorepo root:
```bash
pnpm build:siab
```

Or build all brands at once:
```bash
pnpm build:all
```

## Customization log

Where this registry diverges from upstream shadcn:

- **`button`** — adds `xs`, `touch`, `icon-xs`, `icon-sm`, `icon-lg` size variants. Forces `cursor-pointer`. Explicit dark-mode destructive hover fix.
- **`avatar`** — adds `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount` subcomponents and a `size` prop with `data-[size=*]` styling.
- **`input`** — extra Tailwind classes for selection color, file-input styling, dark-mode `bg-input/30`.
- **`theme`** — Poppins (sans), shadow tokens at 8 levels, OKLch palette tuned to SIAB's neutral-with-indigo-sidebar look.

All other primitives are upstream-faithful at v1 release.
