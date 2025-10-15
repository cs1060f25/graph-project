import { theme } from "@/app/theme";

const sections = [
  {
    title: "Library",
    items: ["All Papers", "Saved", "Recently Viewed", "Tags"],
  },
  {
    title: "Filters",
    items: ["Date", "Author", "Topic", "Journal"],
  },
];

export const Sidebar = () => {
  return (
    <aside
      className="flex flex-col gap-6 px-6 py-8"
      style={{
        backgroundColor: theme.colors.sidebarBackground,
        color: theme.colors.textSecondary,
        width: theme.layout.sidebar.width,
      }}
    >
      {sections.map((section) => (
        <div key={section.title}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--accent)]"
            style={{ color: theme.colors.textPrimary }}
          >
            {section.title}
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {section.items.map((item) => (
              <li
                key={item}
                className="cursor-pointer transition-colors"
                style={{
                  color: theme.colors.textSecondary,
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
};
