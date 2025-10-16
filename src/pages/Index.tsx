import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PaperCard } from "@/components/PaperCard";
import { ChatInterface } from "@/components/ChatInterface";
import { TopicExplorer } from "@/components/TopicExplorer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, MessageSquare, Sparkles } from "lucide-react";
import { toast } from "sonner";

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

const Index = () => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      const { data, error } = await supabase
        .from("papers")
        .select("*")
        .order("published_date", { ascending: false });

      if (error) throw error;
      setPapers(data || []);
    } catch (error) {
      console.error("Error fetching papers:", error);
      toast.error("Failed to load papers");
    } finally {
      setLoading(false);
    }
  };

  const filteredPapers = selectedCategory
    ? papers.filter((p) => p.category === selectedCategory)
    : papers;

  const categoryCounts = papers.reduce((acc, paper) => {
    acc[paper.category] = (acc[paper.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const paperContext = selectedCategory
    ? `Viewing ${selectedCategory} papers`
    : `All categories: ${Object.keys(categoryCounts).join(", ")}`;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-research p-3 rounded-xl">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Research Explorer</h1>
              <p className="text-sm text-muted-foreground">
                Your intelligent research paper library
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="library" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-card border border-border">
            <TabsTrigger value="library" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Library
            </TabsTrigger>
            <TabsTrigger value="explore" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Explore
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Your Papers</h2>
                <p className="text-muted-foreground">
                  {filteredPapers.length} papers
                  {selectedCategory && " in this category"}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-4 pr-4">
                  {filteredPapers.map((paper) => (
                    <PaperCard key={paper.id} paper={paper} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="explore">
            <TopicExplorer
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              categoryCounts={categoryCounts}
            />
            
            {selectedCategory && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Papers in this category
                </h3>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4 pr-4">
                    {filteredPapers.map((paper) => (
                      <PaperCard key={paper.id} paper={paper} />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat">
            <div className="max-w-4xl mx-auto">
              <ChatInterface paperContext={paperContext} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
