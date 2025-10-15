import { colors, typography } from "@/lib/theme";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: ReactNode;
};

const styles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: colors.accentPurple,
    color: colors.textPrimary,
    border: `1px solid ${colors.accentPurple}`,
  },
  secondary: {
    backgroundColor: "transparent",
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`,
  },
  ghost: {
    backgroundColor: "transparent",
    color: colors.textSecondary,
    border: "1px solid transparent",
  },
};

const baseStyle: React.CSSProperties = {
  fontFamily: typography.fontFamily,
  fontSize: typography.fontSizeBase,
  fontWeight: typography.fontWeightBold,
  lineHeight: typography.lineHeight,
  padding: "8px 12px",
  borderRadius: "8px",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
  transition: "background-color 0.15s ease, color 0.15s ease",
};

export default function Button({
  children,
  variant = "primary",
  icon,
  style,
  ...props
}: ButtonProps) {
  return (
    <button style={{ ...baseStyle, ...styles[variant], ...style }} {...props}>
      {icon}
      {children}
    </button>
  );
}
