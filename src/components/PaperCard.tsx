import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  arxiv_id: string;
  category: string;
  published_date: string;
  pdf_url: string;
}

interface PaperCardProps {
  paper: Paper;
  onSelect?: (paper: Paper) => void;
}

const categoryColors: Record<string, string> = {
  "cs.AI": "bg-category-ai/20 text-category-ai border-category-ai/30",
  "cs.LG": "bg-category-ml/20 text-category-ml border-category-ml/30",
  "cs.CV": "bg-category-cv/20 text-category-cv border-category-cv/30",
  "cs.CL": "bg-category-nlp/20 text-category-nlp border-category-nlp/30",
  "cs.RO": "bg-category-robotics/20 text-category-robotics border-category-robotics/30",
};

const categoryLabels: Record<string, string> = {
  "cs.AI": "Artificial Intelligence",
  "cs.LG": "Machine Learning",
  "cs.CV": "Computer Vision",
  "cs.CL": "NLP",
  "cs.RO": "Robotics",
};

export const PaperCard = ({ paper, onSelect }: PaperCardProps) => {
  const publishedYear = new Date(paper.published_date).getFullYear();
  const authorList = paper.authors.slice(0, 3).join(", ") + 
    (paper.authors.length > 3 ? ` et al.` : "");

  return (
    <Card 
      className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 shadow-paper hover:shadow-glow cursor-pointer group"
      onClick={() => onSelect?.(paper)}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {paper.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {authorList} • {publishedYear}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={`${categoryColors[paper.category]} border shrink-0`}
          >
            {categoryLabels[paper.category]}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-3">
          {paper.abstract}
        </p>

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              window.open(paper.pdf_url, '_blank');
            }}
          >
            <FileText className="h-4 w-4" />
            PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`https://arxiv.org/abs/${paper.arxiv_id}`, '_blank');
            }}
          >
            <ExternalLink className="h-4 w-4" />
            arXiv
          </Button>
          <span className="text-xs text-muted-foreground ml-auto">
            {paper.arxiv_id}
          </span>
        </div>
      </div>
    </Card>
  );
};
