import { theme } from "@/app/theme";

export const Header = () => {
  return (
    <header
      className="flex items-center justify-between px-8"
      style={{
        backgroundColor: theme.colors.background,
        height: theme.layout.header.height,
        borderBottom: `1px solid ${theme.colors.border}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: theme.colors.accentPurple }}
        >
          <span className="text-lg font-semibold text-white">RN</span>
        </div>
        <span className="text-lg font-semibold text-white">Research Navigator</span>
      </div>
      <div className="flex w-1/2 items-center rounded-lg border px-4 py-2"
        style={{
          backgroundColor: theme.colors.panelBackground,
          borderColor: theme.colors.border,
        }}
      >
        <input
          className="w-full bg-transparent text-sm focus:outline-none"
          placeholder="Search papers, authors, or topics..."
          style={{ color: theme.colors.textPrimary }}
        />
      </div>
      <button
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{
          backgroundColor: theme.colors.panelBackground,
          color: theme.colors.textPrimary,
          border: `1px solid ${theme.colors.border}`,
        }}
        type="button"
        aria-label="Profile menu"
      >
        ☰
      </button>
    </header>
  );
};
