import { colors, typography } from "@/lib/theme";
import type { HTMLAttributes } from "react";

type PillProps = HTMLAttributes<HTMLSpanElement> & {
  active?: boolean;
};

export default function Pill({ active = false, style, children, ...props }: PillProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: "999px",
        border: active ? `1px solid ${colors.accentPurple}` : `1px solid ${colors.accentGray}`,
        backgroundColor: active ? colors.accentPurple : colors.accentGray,
        color: colors.textPrimary,
        fontFamily: typography.fontFamily,
        fontSize: "12px",
        fontWeight: typography.fontWeightBold,
        textTransform: "uppercase",
        letterSpacing: "0.02em",
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
