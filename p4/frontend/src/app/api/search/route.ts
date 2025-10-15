import { NextRequest, NextResponse } from 'next/server';

// Mock data with citations
const mockPapers = [
  { 
    id: 'p1', 
    title: 'Attention Is All You Need', 
    authors: 'Vaswani et al.', 
    year: 2017, 
    venue: 'NIPS', 
    keywords: ['transformer', 'attention', 'nlp'],
    citations: ['p2', 'p3', 'p5', 'p6', 'p8', 'p9', 'p10'],
    citedBy: [],
    concepts: ['Self-Attention', 'Multi-Head Attention', 'Positional Encoding']
  },
  { 
    id: 'p2', 
    title: 'BERT: Pre-training of Deep Bidirectional Transformers', 
    authors: 'Devlin et al.', 
    year: 2018, 
    venue: 'NAACL', 
    keywords: ['transformer', 'bert', 'nlp'],
    citations: ['p1'],
    citedBy: ['p3', 'p6', 'p8', 'p10'],
    concepts: ['Bidirectional Encoding', 'Pre-training', 'Fine-tuning']
  },
  { 
    id: 'p3', 
    title: 'GPT-3: Language Models are Few-Shot Learners', 
    authors: 'Brown et al.', 
    year: 2020, 
    venue: 'NeurIPS', 
    keywords: ['transformer', 'gpt', 'language-model'],
    citations: ['p1', 'p2'],
    citedBy: ['p6', 'p10'],
    concepts: ['Few-Shot Learning', 'In-Context Learning', 'Scaling Laws']
  },
  { 
    id: 'p4', 
    title: 'ResNet: Deep Residual Learning for Image Recognition', 
    authors: 'He et al.', 
    year: 2016, 
    venue: 'CVPR', 
    keywords: ['resnet', 'cnn', 'computer-vision'],
    citations: [],
    citedBy: ['p5', 'p7'],
    concepts: ['Residual Connections', 'Skip Connections', 'Deep Networks']
  },
  { 
    id: 'p5', 
    title: 'Vision Transformer: An Image is Worth 16x16 Words', 
    authors: 'Dosovitskiy et al.', 
    year: 2020, 
    venue: 'ICLR', 
    keywords: ['transformer', 'vision', 'computer-vision'],
    citations: ['p1', 'p4'],
    citedBy: ['p6', 'p8', 'p9'],
    concepts: ['Patch Embedding', 'Vision Transformer', 'Image Classification']
  },
  { 
    id: 'p6', 
    title: 'DALL-E: Creating Images from Text', 
    authors: 'Ramesh et al.', 
    year: 2021, 
    venue: 'ICML', 
    keywords: ['transformer', 'generation', 'multimodal'],
    citations: ['p1', 'p2', 'p3', 'p5'],
    citedBy: ['p8', 'p9'],
    concepts: ['Text-to-Image', 'Discrete VAE', 'CLIP']
  },
  { 
    id: 'p7', 
    title: 'YOLO: Real-Time Object Detection', 
    authors: 'Redmon et al.', 
    year: 2016, 
    venue: 'CVPR', 
    keywords: ['yolo', 'object-detection', 'computer-vision'],
    citations: ['p4'],
    citedBy: [],
    concepts: ['Real-Time Detection', 'Single Shot', 'Bounding Box']
  },
  { 
    id: 'p8', 
    title: 'CLIP: Learning Transferable Visual Representations', 
    authors: 'Radford et al.', 
    year: 2021, 
    venue: 'ICML', 
    keywords: ['transformer', 'clip', 'multimodal'],
    citations: ['p1', 'p2', 'p5', 'p6'],
    citedBy: ['p9'],
    concepts: ['Contrastive Learning', 'Vision-Language', 'Zero-Shot']
  },
  { 
    id: 'p9', 
    title: 'Stable Diffusion: High-Resolution Image Synthesis', 
    authors: 'Rombach et al.', 
    year: 2022, 
    venue: 'CVPR', 
    keywords: ['transformer', 'diffusion', 'generation'],
    citations: ['p1', 'p5', 'p6', 'p8'],
    citedBy: [],
    concepts: ['Latent Diffusion', 'U-Net', 'Text Conditioning']
  },
  { 
    id: 'p10', 
    title: 'ChatGPT: Optimizing Language Models for Dialogue', 
    authors: 'OpenAI', 
    year: 2022, 
    venue: 'OpenAI', 
    keywords: ['transformer', 'chatgpt', 'dialogue'],
    citations: ['p1', 'p2', 'p3'],
    citedBy: [],
    concepts: ['RLHF', 'Instruction Following', 'Dialogue Systems']
  }
];

// Helper functions (currently unused but kept for future use)
// function cosineSimilarity(vecA: number[], vecB: number[]): number {
//   if (vecA.length !== vecB.length) return 0;
//   const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
//   const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
//   const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
//   return magnitudeA === 0 || magnitudeB === 0 ? 0 : dotProduct / (magnitudeA * magnitudeB);
// }

// function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
//   if (setA.size === 0 && setB.size === 0) return 0;
//   const intersection = new Set([...setA].filter(x => setB.has(x)));
//   const union = new Set([...setA, ...setB]);
//   return union.size === 0 ? 0 : intersection.size / union.size;
// }

function minMaxNormalize(values: number[]): number[] {
  if (values.length === 0) return [];
  if (values.length === 1) return [0.5]; // Single value gets middle score
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  if (max === min) return values.map(() => 0.5);
  
  return values.map(v => (v - min) / (max - min));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywords = [], authors = [], papers = [] } = body;

    // Find relevant papers
    const relevantPapers = mockPapers.filter(paper => {
      const keywordMatch = keywords.some((kw: string) => 
        paper.keywords.some(pk => pk.toLowerCase().includes(kw.toLowerCase()))
      );
      const authorMatch = authors.some((author: string) => 
        paper.authors.toLowerCase().includes(author.toLowerCase())
      );
      const paperMatch = papers.includes(paper.id);
      
      return keywordMatch || authorMatch || paperMatch;
    });

    if (relevantPapers.length < 2) {
      return NextResponse.json({
        nodes: relevantPapers,
        edges: []
      });
    }

    // Calculate edge scores
    const edges: Array<{
      id: string;
      source: string;
      target: string;
      weight: number;
      s_kw: number;
      s_cite: number;
      s_sem: number;
      layer1: boolean;
      layer2: boolean;
      layer3: boolean;
    }> = [];
    const allEdgeScores: number[] = [];

    for (let i = 0; i < relevantPapers.length; i++) {
      for (let j = i + 1; j < relevantPapers.length; j++) {
        const paperA = relevantPapers[i];
        const paperB = relevantPapers[j];

        // Mock similarity scores for demonstration
        const s_kw = Math.random() * 0.8 + 0.1; // 0.1 to 0.9
        const s_cite = Math.random() * 0.6 + 0.2; // 0.2 to 0.8  
        const s_sem = Math.random() * 0.7 + 0.15; // 0.15 to 0.85

        // Combined edge score
        const edgeScore = 0.3 * s_kw + 0.4 * s_cite + 0.3 * s_sem;
        allEdgeScores.push(edgeScore);

        edges.push({
          id: `${paperA.id}-${paperB.id}`,
          source: paperA.id,
          target: paperB.id,
          weight: edgeScore,
          s_kw,
          s_cite,
          s_sem,
          layer1: false,
          layer2: false,
          layer3: false
        });
      }
    }

    // Normalize edge scores
    const normalizedScores = minMaxNormalize(allEdgeScores);
    
    // Update edges with normalized scores
    edges.forEach((edge, index) => {
      edge.weight = normalizedScores[index];
    });

    // Calculate thresholds for layers
    const sortedScores = [...normalizedScores].sort((a, b) => b - a);
    const t1 = sortedScores[Math.floor(sortedScores.length * 0.1)] || 0.8; // Layer 1: top 10% - strongest
    const t2 = sortedScores[Math.floor(sortedScores.length * 0.4)] || 0.6; // Layer 2: top 40% - strong + medium  
    const t3 = sortedScores[Math.floor(sortedScores.length * 0.7)] || 0.4; // Layer 3: top 70% - all strong connections

    // Assign layers to edges
    edges.forEach(edge => {
      edge.layer1 = edge.weight >= t1;
      edge.layer2 = edge.weight >= t2;
      edge.layer3 = edge.weight >= t3;
    });

    return NextResponse.json({
      nodes: relevantPapers,
      edges: edges
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
