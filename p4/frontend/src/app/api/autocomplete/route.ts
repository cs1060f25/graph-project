import { NextRequest, NextResponse } from 'next/server';

// Mock data - same as your backend
const mockPapers = [
  { id: 'p1', title: 'Attention Is All You Need', authors: 'Vaswani et al.', year: 2017, venue: 'NIPS', keywords: ['transformer', 'attention', 'nlp'] },
  { id: 'p2', title: 'BERT: Pre-training of Deep Bidirectional Transformers', authors: 'Devlin et al.', year: 2018, venue: 'NAACL', keywords: ['transformer', 'bert', 'nlp'] },
  { id: 'p3', title: 'GPT-3: Language Models are Few-Shot Learners', authors: 'Brown et al.', year: 2020, venue: 'NeurIPS', keywords: ['transformer', 'gpt', 'language-model'] },
  { id: 'p4', title: 'ResNet: Deep Residual Learning for Image Recognition', authors: 'He et al.', year: 2016, venue: 'CVPR', keywords: ['resnet', 'cnn', 'computer-vision'] },
  { id: 'p5', title: 'Vision Transformer: An Image is Worth 16x16 Words', authors: 'Dosovitskiy et al.', year: 2020, venue: 'ICLR', keywords: ['transformer', 'vision', 'computer-vision'] },
  { id: 'p6', title: 'DALL-E: Creating Images from Text', authors: 'Ramesh et al.', year: 2021, venue: 'ICML', keywords: ['transformer', 'generation', 'multimodal'] },
  { id: 'p7', title: 'YOLO: Real-Time Object Detection', authors: 'Redmon et al.', year: 2016, venue: 'CVPR', keywords: ['yolo', 'object-detection', 'computer-vision'] },
  { id: 'p8', title: 'CLIP: Learning Transferable Visual Representations', authors: 'Radford et al.', year: 2021, venue: 'ICML', keywords: ['transformer', 'clip', 'multimodal'] },
  { id: 'p9', title: 'Stable Diffusion: High-Resolution Image Synthesis', authors: 'Rombach et al.', year: 2022, venue: 'CVPR', keywords: ['transformer', 'diffusion', 'generation'] },
  { id: 'p10', title: 'ChatGPT: Optimizing Language Models for Dialogue', authors: 'OpenAI', year: 2022, venue: 'OpenAI', keywords: ['transformer', 'chatgpt', 'dialogue'] }
];

const mockAuthors = [
  'Vaswani et al.', 'Devlin et al.', 'Brown et al.', 'He et al.', 'Dosovitskiy et al.',
  'Ramesh et al.', 'Redmon et al.', 'Radford et al.', 'Rombach et al.', 'OpenAI'
];

const mockKeywords = [
  'transformer', 'attention', 'nlp', 'bert', 'gpt', 'language-model', 'resnet', 'cnn',
  'computer-vision', 'vision', 'generation', 'multimodal', 'yolo', 'object-detection',
  'clip', 'diffusion', 'chatgpt', 'dialogue'
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'keywords';

  if (!query.trim()) {
    return NextResponse.json([]);
  }

  const lowerQuery = query.toLowerCase();

  try {
    let results: string[] | typeof mockPapers = [];

    switch (type) {
      case 'keywords':
        results = mockKeywords
          .filter(keyword => keyword.toLowerCase().includes(lowerQuery))
          .slice(0, 5);
        break;

      case 'authors':
        results = mockAuthors
          .filter(author => author.toLowerCase().includes(lowerQuery))
          .slice(0, 5);
        break;

      case 'papers':
        results = mockPapers
          .filter(paper => 
            paper.title.toLowerCase().includes(lowerQuery) ||
            paper.authors.toLowerCase().includes(lowerQuery)
          )
          .slice(0, 5);
        break;

      default:
        results = [];
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Autocomplete error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
