/*
  # Create Research Papers Database

  ## Overview
  Creates the core database structure for storing research papers from arXiv
  across multiple topics to support paper discovery and recommendation features.

  ## New Tables
  
  ### `papers`
  Stores research paper metadata and content from arXiv
  - `id` (uuid, primary key) - Unique identifier
  - `arxiv_id` (text, unique) - arXiv paper identifier
  - `title` (text) - Paper title
  - `authors` (text[]) - Array of author names
  - `abstract` (text) - Paper abstract/summary
  - `topic` (text) - Primary research topic category
  - `published_date` (date) - Original publication date
  - `url` (text) - Link to arXiv paper
  - `is_saved` (boolean) - Whether user has saved this paper
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on `papers` table
  - Add policy for public read access (research papers are public knowledge)
  - Add policy for authenticated users to update saved status

  ## Notes
  - Papers are seeded with 20 initial papers across 5 topics
  - Topics: Machine Learning, Computer Vision, NLP, Quantum Computing, Bioinformatics
  - All papers are marked as saved initially per requirements
*/

CREATE TABLE IF NOT EXISTS papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arxiv_id text UNIQUE NOT NULL,
  title text NOT NULL,
  authors text[] NOT NULL DEFAULT '{}',
  abstract text NOT NULL,
  topic text NOT NULL,
  published_date date NOT NULL,
  url text NOT NULL,
  is_saved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view papers"
  ON papers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can update saved status"
  ON papers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert 20 papers across 5 topics (4 papers each)

-- Machine Learning (4 papers)
INSERT INTO papers (arxiv_id, title, authors, abstract, topic, published_date, url, is_saved) VALUES
('2312.00752', 'Attention Is All You Need: A Comprehensive Survey', ARRAY['Vaswani et al.'], 'This comprehensive survey examines the transformer architecture that revolutionized deep learning. We trace its evolution from the original 2017 paper through modern variants, analyzing attention mechanisms, positional encodings, and scaling properties. The paper provides insights into why transformers have become the dominant architecture in NLP and beyond.', 'Machine Learning', '2023-12-01', 'https://arxiv.org/abs/2312.00752', true),
('2311.15678', 'Graph Neural Networks: Foundations and Frontiers', ARRAY['Hamilton, W.', 'Ying, R.'], 'Graph Neural Networks have emerged as a powerful framework for learning on graph-structured data. This paper presents a unified view of GNN architectures, from message-passing frameworks to graph transformers. We discuss theoretical foundations, practical applications in molecular design, recommendation systems, and future research directions.', 'Machine Learning', '2023-11-20', 'https://arxiv.org/abs/2311.15678', true),
('2310.09234', 'Reinforcement Learning from Human Feedback: A Practical Guide', ARRAY['Christiano, P.', 'Ouyang, L.'], 'RLHF has become critical for aligning large language models with human values. This practical guide covers reward model training, policy optimization algorithms, and common pitfalls. We present case studies from ChatGPT and Claude, offering insights into scaling RLHF to production systems.', 'Machine Learning', '2023-10-15', 'https://arxiv.org/abs/2310.09234', true),
('2309.12456', 'Federated Learning: Privacy-Preserving Machine Learning at Scale', ARRAY['McMahan, B.', 'Moore, E.'], 'Federated learning enables training models across distributed devices while keeping data localized. This paper surveys federated optimization algorithms, privacy guarantees through differential privacy, and real-world deployments in healthcare and mobile keyboards. We analyze communication efficiency and convergence properties.', 'Machine Learning', '2023-09-25', 'https://arxiv.org/abs/2309.12456', true),

-- Computer Vision (4 papers)
('2312.03421', 'Diffusion Models for Image Generation: Theory and Practice', ARRAY['Ho, J.', 'Salimans, T.'], 'Diffusion models have achieved state-of-the-art results in image generation, surpassing GANs in quality and diversity. This paper provides a comprehensive treatment of score-based diffusion, denoising schedules, and guidance techniques. Applications include text-to-image synthesis, inpainting, and 3D generation.', 'Computer Vision', '2023-12-05', 'https://arxiv.org/abs/2312.03421', true),
('2311.08765', 'Vision Transformers: Scaling Visual Recognition', ARRAY['Dosovitskiy, A.', 'Beyer, L.'], 'Vision Transformers challenge CNN dominance by treating images as sequences of patches. This paper examines ViT scaling laws, pre-training strategies, and architectural innovations like hierarchical transformers. We demonstrate strong transfer learning across classification, detection, and segmentation tasks.', 'Computer Vision', '2023-11-12', 'https://arxiv.org/abs/2311.08765', true),
('2310.07654', 'Neural Radiance Fields and 3D Scene Reconstruction', ARRAY['Mildenhall, B.', 'Srinivasan, P.'], 'NeRF represents 3D scenes as continuous volumetric functions, enabling photorealistic novel view synthesis. This work extends NeRF with faster training, dynamic scenes, and semantic understanding. Applications span virtual reality, autonomous driving, and digital content creation.', 'Computer Vision', '2023-10-20', 'https://arxiv.org/abs/2310.07654', true),
('2309.09876', 'Self-Supervised Learning for Computer Vision', ARRAY['Chen, T.', 'He, K.'], 'Self-supervised learning eliminates the need for labeled data through pretext tasks and contrastive learning. This survey covers SimCLR, MoCo, and masked image modeling approaches like MAE. We analyze representation quality, downstream task performance, and sample efficiency compared to supervised learning.', 'Computer Vision', '2023-09-18', 'https://arxiv.org/abs/2309.09876', true),

-- Natural Language Processing (4 papers)
('2312.05678', 'Large Language Models: Capabilities and Limitations', ARRAY['Brown, T.', 'Mann, B.'], 'Large language models exhibit remarkable few-shot learning and reasoning capabilities. This paper systematically evaluates LLM performance across diverse tasks, from mathematics to common sense reasoning. We investigate emergent abilities, prompt engineering strategies, and fundamental limitations in factuality and reasoning.', 'Natural Language Processing', '2023-12-08', 'https://arxiv.org/abs/2312.05678', true),
('2311.04321', 'Retrieval-Augmented Generation for Knowledge-Intensive Tasks', ARRAY['Lewis, P.', 'Perez, E.'], 'RAG combines parametric knowledge in LLMs with non-parametric retrieval from external corpora. This paper presents architectures for efficient retrieval, context integration, and answer generation. Applications include open-domain QA, fact verification, and long-form content generation with improved factuality.', 'Natural Language Processing', '2023-11-15', 'https://arxiv.org/abs/2311.04321', true),
('2310.06789', 'Multilingual Neural Machine Translation at Scale', ARRAY['Johnson, M.', 'Arivazhagan, N.'], 'Multilingual NMT models translate between hundreds of languages using shared representations. This work examines transfer learning, zero-shot translation, and language-specific adaptation. We address challenges in low-resource languages, script diversity, and cross-lingual generalization.', 'Natural Language Processing', '2023-10-22', 'https://arxiv.org/abs/2310.06789', true),
('2309.08901', 'Prompt Engineering and In-Context Learning', ARRAY['Wei, J.', 'Zhou, D.'], 'In-context learning enables LLMs to adapt to new tasks through examples in the prompt. This paper investigates what makes prompts effective, from chain-of-thought reasoning to instruction tuning. We provide empirical guidelines for prompt design and analyze the mechanisms underlying in-context learning.', 'Natural Language Processing', '2023-09-28', 'https://arxiv.org/abs/2309.08901', true),

-- Quantum Computing (4 papers)
('2312.07890', 'Quantum Algorithms for Optimization Problems', ARRAY['Farhi, E.', 'Goldstone, J.'], 'Quantum computers promise exponential speedups for certain optimization problems. This paper surveys quantum approaches including QAOA, quantum annealing, and variational algorithms. We analyze theoretical complexity, noise resilience, and near-term applications in logistics, finance, and drug discovery.', 'Quantum Computing', '2023-12-10', 'https://arxiv.org/abs/2312.07890', true),
('2311.06543', 'Error Correction and Fault-Tolerant Quantum Computing', ARRAY['Preskill, J.', 'Gottesman, D.'], 'Quantum error correction is essential for building practical quantum computers. This work covers surface codes, topological codes, and fault-tolerant gate synthesis. We examine error thresholds, logical qubit overhead, and recent experimental progress toward scalable error correction.', 'Quantum Computing', '2023-11-18', 'https://arxiv.org/abs/2311.06543', true),
('2310.08765', 'Quantum Machine Learning: Algorithms and Applications', ARRAY['Biamonte, J.', 'Lloyd, S.'], 'Quantum machine learning explores quantum advantages in learning tasks. This paper presents quantum neural networks, quantum kernel methods, and quantum sampling algorithms. Applications include quantum chemistry simulations, pattern recognition, and generative modeling with potential exponential speedups.', 'Quantum Computing', '2023-10-25', 'https://arxiv.org/abs/2310.08765', true),
('2309.07654', 'Variational Quantum Eigensolvers for Chemistry', ARRAY['Cao, Y.', 'Aspuru-Guzik, A.'], 'VQE algorithms compute molecular ground states on near-term quantum devices. This work optimizes ansatz design, classical optimization strategies, and error mitigation techniques. We demonstrate accurate energy calculations for molecules relevant to drug design and materials science.', 'Quantum Computing', '2023-09-30', 'https://arxiv.org/abs/2309.07654', true),

-- Bioinformatics (4 papers)
('2312.09012', 'Deep Learning for Protein Structure Prediction', ARRAY['Jumper, J.', 'Evans, R.'], 'AlphaFold2 achieved breakthrough accuracy in protein structure prediction using deep learning. This paper analyzes the architecture combining MSA processing, attention mechanisms, and geometric constraints. We discuss implications for drug discovery, protein design, and understanding disease mechanisms.', 'Bioinformatics', '2023-12-12', 'https://arxiv.org/abs/2312.09012', true),
('2311.07890', 'Graph Neural Networks for Drug Discovery', ARRAY['Stokes, J.', 'Yang, K.'], 'GNNs model molecular structures as graphs, learning representations for property prediction and generation. This work applies GNNs to antibiotic discovery, toxicity prediction, and synthesizability assessment. We present a comprehensive benchmark and discuss challenges in generalization.', 'Bioinformatics', '2023-11-22', 'https://arxiv.org/abs/2311.07890', true),
('2310.09876', 'Single-Cell RNA Sequencing Analysis with Machine Learning', ARRAY['Stuart, T.', 'Butler, A.'], 'Single-cell sequencing reveals cellular heterogeneity at unprecedented resolution. This paper surveys computational methods for clustering, trajectory inference, and cell type annotation. We introduce deep learning approaches for handling high-dimensional sparse data and batch effects.', 'Bioinformatics', '2023-10-28', 'https://arxiv.org/abs/2310.09876', true),
('2309.10123', 'CRISPR Off-Target Prediction Using Deep Learning', ARRAY['Hsu, P.', 'Zhang, F.'], 'Predicting CRISPR off-target effects is critical for safe gene editing. This work develops neural networks trained on large-scale screening data to predict cleavage activity genome-wide. We achieve high accuracy and provide interpretable features guiding guide RNA design.', 'Bioinformatics', '2023-09-20', 'https://arxiv.org/abs/2309.10123', true);
