import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Cpu, Eye, MessageSquare, Bot } from "lucide-react";

interface TopicExplorerProps {
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  categoryCounts: Record<string, number>;
}

const categoryConfig = {
  "cs.AI": {
    label: "Artificial Intelligence",
    icon: Brain,
    color: "text-category-ai",
    bgColor: "bg-category-ai/10 hover:bg-category-ai/20",
    borderColor: "border-category-ai/30",
  },
  "cs.LG": {
    label: "Machine Learning",
    icon: Cpu,
    color: "text-category-ml",
    bgColor: "bg-category-ml/10 hover:bg-category-ml/20",
    borderColor: "border-category-ml/30",
  },
  "cs.CV": {
    label: "Computer Vision",
    icon: Eye,
    color: "text-category-cv",
    bgColor: "bg-category-cv/10 hover:bg-category-cv/20",
    borderColor: "border-category-cv/30",
  },
  "cs.CL": {
    label: "Natural Language Processing",
    icon: MessageSquare,
    color: "text-category-nlp",
    bgColor: "bg-category-nlp/10 hover:bg-category-nlp/20",
    borderColor: "border-category-nlp/30",
  },
  "cs.RO": {
    label: "Robotics",
    icon: Bot,
    color: "text-category-robotics",
    bgColor: "bg-category-robotics/10 hover:bg-category-robotics/20",
    borderColor: "border-category-robotics/30",
  },
};

export const TopicExplorer = ({
  selectedCategory,
  onCategorySelect,
  categoryCounts,
}: TopicExplorerProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Explore Topics</h2>
        <p className="text-muted-foreground">
          Browse your research library by category
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(categoryConfig).map(([key, config]) => {
          const Icon = config.icon;
          const count = categoryCounts[key] || 0;
          const isSelected = selectedCategory === key;

          return (
            <Card
              key={key}
              className={`p-6 cursor-pointer transition-all duration-300 border-2 ${
                isSelected
                  ? `${config.borderColor} ${config.bgColor} shadow-glow`
                  : `border-border ${config.bgColor}`
              }`}
              onClick={() => onCategorySelect(isSelected ? null : key)}
            >
              <div className="flex items-start justify-between mb-4">
                <Icon className={`h-8 w-8 ${config.color}`} />
                <Badge variant="secondary">{count} papers</Badge>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{config.label}</h3>
              <p className="text-sm text-muted-foreground">{key}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
