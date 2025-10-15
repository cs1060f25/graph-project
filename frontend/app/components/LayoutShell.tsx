import { ReactNode } from "react";
import { theme } from "@/app/theme";

type LayoutShellProps = {
  header: ReactNode;
  sidebar: ReactNode;
  main: ReactNode;
  aside: ReactNode;
};

export function LayoutShell({ header, sidebar, main, aside }: LayoutShellProps) {
  return (
    <div
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.textPrimary,
        minHeight: "100vh",
        fontFamily: theme.typography.fontFamily,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: "56px",
          borderBottom: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.background,
        }}
      >
        {header}
      </header>
      <div style={{ display: "flex", flex: 1 }}>
        <nav
          aria-label="Main navigation"
          style={{
            width: "280px",
            backgroundColor: theme.colors.sidebarBackground,
            borderRight: `1px solid ${theme.colors.border}`,
            padding: "16px",
            color: theme.colors.textSecondary,
          }}
        >
          {sidebar}
        </nav>
        <main style={{ flex: 1, padding: "24px", display: "flex", gap: "24px" }}>{main}</main>
        <aside
          style={{
            width: "360px",
            backgroundColor: theme.colors.panelBackground,
            borderLeft: `1px solid ${theme.colors.border}`,
            padding: "20px",
            color: theme.colors.textSecondary,
          }}
        >
          {aside}
        </aside>
      </div>
    </div>
  );
}

