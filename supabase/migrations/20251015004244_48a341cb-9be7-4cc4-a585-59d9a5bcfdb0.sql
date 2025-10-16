-- Create papers table to store research papers from arXiv
CREATE TABLE public.papers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT[] NOT NULL,
  abstract TEXT NOT NULL,
  arxiv_id TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  published_date DATE NOT NULL,
  pdf_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for category-based queries
CREATE INDEX idx_papers_category ON public.papers(category);

-- Create index for published date
CREATE INDEX idx_papers_published_date ON public.papers(published_date DESC);

-- Enable Row Level Security
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (papers are public research)
CREATE POLICY "Papers are viewable by everyone" 
ON public.papers 
FOR SELECT 
USING (true);

-- Insert 20 sample papers from 5 different arXiv categories
-- Category 1: Artificial Intelligence (cs.AI) - 4 papers
INSERT INTO public.papers (title, authors, abstract, arxiv_id, category, published_date, pdf_url) VALUES
(
  'Attention Is All You Need',
  ARRAY['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit'],
  'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.',
  '1706.03762',
  'cs.AI',
  '2017-06-12',
  'https://arxiv.org/pdf/1706.03762.pdf'
),
(
  'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
  ARRAY['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee', 'Kristina Toutanova'],
  'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers designed to pre-train deep bidirectional representations.',
  '1810.04805',
  'cs.AI',
  '2018-10-11',
  'https://arxiv.org/pdf/1810.04805.pdf'
),
(
  'GPT-3: Language Models are Few-Shot Learners',
  ARRAY['Tom Brown', 'Benjamin Mann', 'Nick Ryder', 'Melanie Subbiah'],
  'We demonstrate that scaling up language models greatly improves task-agnostic, few-shot performance, sometimes reaching competitiveness with prior state-of-the-art fine-tuning approaches.',
  '2005.14165',
  'cs.AI',
  '2020-05-28',
  'https://arxiv.org/pdf/2005.14165.pdf'
),
(
  'Constitutional AI: Harmlessness from AI Feedback',
  ARRAY['Yuntao Bai', 'Saurav Kadavath', 'Sandipan Kundu', 'Amanda Askell'],
  'We study methods for training AI assistants to be harmless and helpful using only AI-generated feedback. We call this approach Constitutional AI.',
  '2212.08073',
  'cs.AI',
  '2022-12-15',
  'https://arxiv.org/pdf/2212.08073.pdf'
);

-- Category 2: Machine Learning (cs.LG) - 4 papers
INSERT INTO public.papers (title, authors, abstract, arxiv_id, category, published_date, pdf_url) VALUES
(
  'Deep Residual Learning for Image Recognition',
  ARRAY['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren', 'Jian Sun'],
  'We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions.',
  '1512.03385',
  'cs.LG',
  '2015-12-10',
  'https://arxiv.org/pdf/1512.03385.pdf'
),
(
  'Adam: A Method for Stochastic Optimization',
  ARRAY['Diederik P. Kingma', 'Jimmy Ba'],
  'We introduce Adam, an algorithm for first-order gradient-based optimization of stochastic objective functions, based on adaptive estimates of lower-order moments.',
  '1412.6980',
  'cs.LG',
  '2014-12-22',
  'https://arxiv.org/pdf/1412.6980.pdf'
),
(
  'Batch Normalization: Accelerating Deep Network Training',
  ARRAY['Sergey Ioffe', 'Christian Szegedy'],
  'Training Deep Neural Networks is complicated by the fact that the distribution of each layer''s inputs changes during training. We refer to this phenomenon as internal covariate shift.',
  '1502.03167',
  'cs.LG',
  '2015-02-11',
  'https://arxiv.org/pdf/1502.03167.pdf'
),
(
  'Dropout: A Simple Way to Prevent Neural Networks from Overfitting',
  ARRAY['Nitish Srivastava', 'Geoffrey Hinton', 'Alex Krizhevsky', 'Ilya Sutskever'],
  'Deep neural nets with a large number of parameters are very powerful machine learning systems. However, overfitting is a serious problem in such networks. We propose dropout as a technique for addressing this problem.',
  '1207.0580',
  'cs.LG',
  '2012-07-02',
  'https://arxiv.org/pdf/1207.0580.pdf'
);

-- Category 3: Computer Vision (cs.CV) - 4 papers
INSERT INTO public.papers (title, authors, abstract, arxiv_id, category, published_date, pdf_url) VALUES
(
  'You Only Look Once: Unified, Real-Time Object Detection',
  ARRAY['Joseph Redmon', 'Santosh Divvala', 'Ross Girshick', 'Ali Farhadi'],
  'We present YOLO, a new approach to object detection. Prior work on object detection repurposes classifiers to perform detection. We frame object detection as a regression problem.',
  '1506.02640',
  'cs.CV',
  '2015-06-08',
  'https://arxiv.org/pdf/1506.02640.pdf'
),
(
  'Generative Adversarial Networks',
  ARRAY['Ian Goodfellow', 'Jean Pouget-Abadie', 'Mehdi Mirza', 'Bing Xu'],
  'We propose a new framework for estimating generative models via an adversarial process, in which we simultaneously train two models: a generative model and a discriminative model.',
  '1406.2661',
  'cs.CV',
  '2014-06-10',
  'https://arxiv.org/pdf/1406.2661.pdf'
),
(
  'U-Net: Convolutional Networks for Biomedical Image Segmentation',
  ARRAY['Olaf Ronneberger', 'Philipp Fischer', 'Thomas Brox'],
  'There is large consent that successful training of deep networks requires many thousand annotated training samples. We present a network and training strategy that relies on data augmentation.',
  '1505.04597',
  'cs.CV',
  '2015-05-18',
  'https://arxiv.org/pdf/1505.04597.pdf'
),
(
  'Mask R-CNN',
  ARRAY['Kaiming He', 'Georgia Gkioxari', 'Piotr Dollár', 'Ross Girshick'],
  'We present a conceptually simple, flexible, and general framework for object instance segmentation. Our approach efficiently detects objects in an image while simultaneously generating a high-quality segmentation mask.',
  '1703.06870',
  'cs.CV',
  '2017-03-20',
  'https://arxiv.org/pdf/1703.06870.pdf'
);

-- Category 4: Natural Language Processing (cs.CL) - 4 papers
INSERT INTO public.papers (title, authors, abstract, arxiv_id, category, published_date, pdf_url) VALUES
(
  'Sequence to Sequence Learning with Neural Networks',
  ARRAY['Ilya Sutskever', 'Oriol Vinyals', 'Quoc V. Le'],
  'Deep Neural Networks have achieved remarkable results in many challenging tasks. However, DNNs cannot be used to map sequences to sequences. We present a general end-to-end approach to sequence learning.',
  '1409.3215',
  'cs.CL',
  '2014-09-10',
  'https://arxiv.org/pdf/1409.3215.pdf'
),
(
  'Neural Machine Translation by Jointly Learning to Align and Translate',
  ARRAY['Dzmitry Bahdanau', 'Kyunghyun Cho', 'Yoshua Bengio'],
  'Neural machine translation is a recently proposed approach to machine translation. We conjecture that the use of a fixed-length vector is a bottleneck in improving the performance of this basic encoder-decoder architecture.',
  '1409.0473',
  'cs.CL',
  '2014-09-01',
  'https://arxiv.org/pdf/1409.0473.pdf'
),
(
  'ELMo: Deep Contextualized Word Representations',
  ARRAY['Matthew Peters', 'Mark Neumann', 'Mohit Iyyer', 'Matt Gardner'],
  'We introduce a new type of deep contextualized word representation that models both complex characteristics of word use and how these uses vary across linguistic contexts.',
  '1802.05365',
  'cs.CL',
  '2018-02-15',
  'https://arxiv.org/pdf/1802.05365.pdf'
),
(
  'XLNet: Generalized Autoregressive Pretraining for Language Understanding',
  ARRAY['Zhilin Yang', 'Zihang Dai', 'Yiming Yang', 'Jaime Carbonell'],
  'With the capability of modeling bidirectional contexts, BERT has been successful in improving many NLP tasks. However, relying on corrupting the input with masks, BERT neglects dependency between masked positions.',
  '1906.08237',
  'cs.CL',
  '2019-06-19',
  'https://arxiv.org/pdf/1906.08237.pdf'
);

-- Category 5: Robotics (cs.RO) - 4 papers
INSERT INTO public.papers (title, authors, abstract, arxiv_id, category, published_date, pdf_url) VALUES
(
  'Deep Reinforcement Learning for Robotic Manipulation',
  ARRAY['Sergey Levine', 'Chelsea Finn', 'Trevor Darrell', 'Pieter Abbeel'],
  'Reinforcement learning holds the promise of enabling autonomous robots to learn large repertoires of behavioral skills with minimal human intervention. We study how deep reinforcement learning can address this challenge.',
  '1610.00633',
  'cs.RO',
  '2016-10-03',
  'https://arxiv.org/pdf/1610.00633.pdf'
),
(
  'Learning Hand-Eye Coordination for Robotic Grasping',
  ARRAY['Sergey Levine', 'Peter Pastor', 'Alex Krizhevsky', 'Julian Ibarz'],
  'We describe a learning-based approach to hand-eye coordination for robotic grasping from monocular images. To learn hand-eye coordination for grasping, we trained a large convolutional neural network.',
  '1603.02199',
  'cs.RO',
  '2016-03-07',
  'https://arxiv.org/pdf/1603.02199.pdf'
),
(
  'Sim-to-Real: Learning Agile Locomotion For Quadruped Robots',
  ARRAY['Jie Tan', 'Tingnan Zhang', 'Erwin Coumans', 'Atil Iscen'],
  'Legged robots pose one of the greatest challenges in robotics. We present a system for learning quadrupedal locomotion policies that can be deployed on a physical robot without any manual tuning.',
  '1804.10332',
  'cs.RO',
  '2018-04-27',
  'https://arxiv.org/pdf/1804.10332.pdf'
),
(
  'PlanNet: Visual Model-Predictive Control',
  ARRAY['Karl Pertsch', 'Oleh Rybkin', 'Frederik Ebert', 'Chelsea Finn'],
  'Visual model-based reinforcement learning has the potential to enable autonomous learning of vision-based control tasks. We present PlanNet, a framework for visual model-predictive control.',
  '1903.10563',
  'cs.RO',
  '2019-03-25',
  'https://arxiv.org/pdf/1903.10563.pdf'
);