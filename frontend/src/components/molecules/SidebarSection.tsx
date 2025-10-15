import { colors, typography } from "@/lib/theme";
import type { ReactNode } from "react";

type SidebarSectionProps = {
  title: string;
  children: ReactNode;
};

export default function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <section
      style={{
        padding: "16px 20px",
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <h2
        style={{
          margin: 0,
          marginBottom: "12px",
          textTransform: "uppercase",
          fontSize: "12px",
          letterSpacing: "0.08em",
          color: colors.textSecondary,
          fontFamily: typography.fontFamily,
          fontWeight: typography.fontWeightBold,
        }}
      >
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>{children}</div>
    </section>
  );
}
