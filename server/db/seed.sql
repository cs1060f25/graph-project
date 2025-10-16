-- Machine Learning Papers
INSERT INTO papers (title, authors, year, arxiv_id, topic, citations, summary) VALUES
('Attention Is All You Need', 'Vaswani et al.', 2017, '1706.03762', 'Machine Learning', 85000, 'Introduces the Transformer architecture, revolutionizing NLP with self-attention mechanisms that eliminate the need for recurrence and convolutions.'),
('BERT: Pre-training of Deep Bidirectional Transformers', 'Devlin et al.', 2018, '1810.04805', 'Machine Learning', 65000, 'Bidirectional encoder representations from transformers for language understanding. BERT obtains new state-of-the-art results on eleven NLP tasks.'),
('Deep Residual Learning for Image Recognition', 'He et al.', 2015, '1512.03385', 'Machine Learning', 120000, 'ResNet architecture enabling training of very deep neural networks through residual connections that address the vanishing gradient problem.'),
('Generative Adversarial Networks', 'Goodfellow et al.', 2014, '1406.2661', 'Machine Learning', 55000, 'Framework for estimating generative models via an adversarial process, training two models simultaneously: a generative model and a discriminative model.');

-- Computer Vision Papers
INSERT INTO papers (title, authors, year, arxiv_id, topic, citations, summary) VALUES
('You Only Look Once: Unified, Real-Time Object Detection', 'Redmon et al.', 2015, '1506.02640', 'Computer Vision', 45000, 'YOLO frames object detection as a regression problem, enabling real-time performance by processing images in a single network evaluation.'),
('Mask R-CNN', 'He et al.', 2017, '1703.06870', 'Computer Vision', 32000, 'Framework for object instance segmentation extending Faster R-CNN by adding a branch for predicting segmentation masks on each Region of Interest.'),
('An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale', 'Dosovitskiy et al.', 2020, '2010.11929', 'Computer Vision', 28000, 'Vision Transformer (ViT) applies transformer architecture directly to sequences of image patches, achieving excellent results on image classification.'),
('NeRF: Representing Scenes as Neural Radiance Fields', 'Mildenhall et al.', 2020, '2003.08934', 'Computer Vision', 15000, 'Novel approach for view synthesis using neural radiance fields to represent 3D scenes as continuous functions, enabling photorealistic novel view generation.');

-- Natural Language Processing Papers
INSERT INTO papers (title, authors, year, arxiv_id, topic, citations, summary) VALUES
('Language Models are Few-Shot Learners', 'Brown et al.', 2020, '2005.14165', 'Natural Language Processing', 42000, 'GPT-3 demonstrates that scaling language models significantly improves task-agnostic few-shot performance across many NLP tasks.'),
('RoBERTa: A Robustly Optimized BERT Pretraining Approach', 'Liu et al.', 2019, '1907.11692', 'Natural Language Processing', 18000, 'Improved training methodology for BERT models through longer training, bigger batches, removing NSP, and training on more data.'),
('Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer', 'Raffel et al.', 2019, '1910.10683', 'Natural Language Processing', 22000, 'T5 introduces a unified framework treating every NLP problem as text-to-text, achieving state-of-the-art results across many tasks.'),
('ELECTRA: Pre-training Text Encoders as Discriminators', 'Clark et al.', 2020, '2003.10555', 'Natural Language Processing', 8500, 'More efficient pre-training approach using replaced token detection instead of masked language modeling, achieving better performance with less compute.');

-- Reinforcement Learning Papers
INSERT INTO papers (title, authors, year, arxiv_id, topic, citations, summary) VALUES
('Proximal Policy Optimization Algorithms', 'Schulman et al.', 2017, '1707.06347', 'Reinforcement Learning', 28000, 'PPO is a policy gradient method that uses a clipped objective function to enable stable learning with good sample efficiency.'),
('Playing Atari with Deep Reinforcement Learning', 'Mnih et al.', 2013, '1312.5602', 'Reinforcement Learning', 35000, 'First deep learning model to successfully learn control policies directly from high-dimensional sensory input using reinforcement learning.'),
('Mastering the Game of Go with Deep Neural Networks', 'Silver et al.', 2016, '1712.01815', 'Reinforcement Learning', 12000, 'AlphaGo combines deep neural networks with Monte Carlo tree search to achieve superhuman performance in the game of Go.'),
('Soft Actor-Critic: Off-Policy Maximum Entropy Deep RL', 'Haarnoja et al.', 2018, '1801.01290', 'Reinforcement Learning', 9500, 'Off-policy algorithm that optimizes a stochastic policy in an entropy-regularized framework, achieving state-of-the-art performance.');

-- Graph Neural Networks Papers
INSERT INTO papers (title, authors, year, arxiv_id, topic, citations, summary) VALUES
('Semi-Supervised Classification with Graph Convolutional Networks', 'Kipf & Welling', 2016, '1609.02907', 'Graph Neural Networks', 24000, 'Introduces a scalable approach for semi-supervised learning on graph-structured data using localized first-order approximations of spectral graph convolutions.'),
('Inductive Representation Learning on Large Graphs', 'Hamilton et al.', 2017, '1706.02216', 'Graph Neural Networks', 15000, 'GraphSAGE framework learns node embeddings by sampling and aggregating features from local neighborhoods, enabling inductive learning.'),
('Graph Attention Networks', 'Veličković et al.', 2017, '1710.10903', 'Graph Neural Networks', 18000, 'Introduces attention mechanisms to graph neural networks, allowing nodes to attend over their neighborhoods with different weights.'),
('Neural Message Passing for Quantum Chemistry', 'Gilmer et al.', 2017, '1704.01212', 'Graph Neural Networks', 11000, 'Unified framework for learning on graph structures through message passing, demonstrating effectiveness on molecular property prediction.');