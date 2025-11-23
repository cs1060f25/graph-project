# Client UI Guidelines

This small guide documents the visual system and conventions used by the React client so contributors produce consistent, professional UI.

Goals
- Clear, minimal, and professional visual language.
- Accessible components (semantic HTML + ARIA where appropriate).
- Consistent spacing, typography and color palette.

Key conventions
- Icons: Use the shared `Icon` component (`src/components/Icon.jsx`) instead of emojis. This ensures consistent sizing, color, and accessibility.
- Buttons: Prefer an icon + text pattern for primary actions. Keep labels short and use `title` attributes for additional hints.
- Navigation: Keep a single source of truth for primary navigation (the main `Navbar`). Avoid duplicating top-level links inside pages.
- Colors & typography: The app uses a dark theme. Use classes and shared styles in `src/index.css` and page-level CSS files for layout. Keep font sizes consistent (base ~16px).
- Spacing: Use consistent gap sizes (0.5rem / 1rem / 1.5rem) and border radii (6-12px) as seen in existing styles.

Accessibility
- Provide `aria-label` for decorative icons when they convey meaning.
- Use semantic elements (`header`, `main`, `nav`, `button`, `form`) to improve screen reader experience.
- Ensure color contrast is sufficient for text and controls.

How to add an icon
1. If an appropriate icon name exists in `Icon.jsx`, import and use it:

```jsx
import Icon from '../components/Icon';

<button>
  <Icon name="search" ariaLabel="Search" /> Search
</button>
```

2. To add a new icon, update `src/components/Icon.jsx` with a small SVG symbol keyed by name.

Notes
- Avoid using emojis in the UI. They are visually inconsistent across platforms and reduce perceived professionalism.
- Keep console logs and warnings clean of emojis. Use plain text for developer-facing messages.

This file is intentionally short — treat it as a living guide and expand as the design system matures.
