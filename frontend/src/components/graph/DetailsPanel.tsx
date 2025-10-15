import { theme } from "@/app/theme";
import type { Paper } from "./types";

type DetailsPanelProps = {
  paper?: Paper;
};

export const DetailsPanel = ({ paper }: DetailsPanelProps) => {
  return (
    <aside
      className="flex h-full flex-col gap-6 px-6 py-8"
      style={{
        backgroundColor: theme.colors.panelBackground,
        borderLeft: `1px solid ${theme.colors.border}`,
        width: theme.layout.rightPane.width,
      }}
    >
      {paper ? (
        <div className="space-y-4">
          <div>
            <h2
              className="text-xl font-semibold"
              style={{ color: theme.colors.textPrimary }}
            >
              {paper.title}
            </h2>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {paper.authors.join(", ")} • {paper.year}
            </p>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: theme.colors.textSecondary }}>
            {paper.abstract}
          </p>
          <div className="flex flex-wrap gap-2">
            {paper.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-3 py-1 text-xs"
                style={{
                  backgroundColor: theme.colors.accentGray,
                  color: theme.colors.textPrimary,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex gap-3">
            {paper.links.doi && (
              <a
                href={`https://doi.org/${paper.links.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium"
                style={{ color: theme.colors.accentPurple }}
              >
                DOI
              </a>
            )}
            {paper.links.pdf && (
              <a
                href={paper.links.pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium"
                style={{ color: theme.colors.accentPurple }}
              >
                PDF
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center text-sm"
          style={{ color: theme.colors.textSecondary }}
        >
          Select a paper to view details.
        </div>
      )}
    </aside>
  );
};
