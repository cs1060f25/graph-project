-- Research Graph Explorer - Sample Database Schema and Data
-- This file contains the SQL schema and sample data for the research paper database

-- Create tables
CREATE TABLE IF NOT EXISTS papers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    abstract TEXT,
    venue TEXT,
    year INTEGER,
    citation_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS paper_authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paper_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    is_first_author BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (paper_id) REFERENCES papers (id),
    FOREIGN KEY (author_id) REFERENCES authors (id)
);

CREATE TABLE IF NOT EXISTS citations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    citing_paper_id INTEGER NOT NULL,
    cited_paper_id INTEGER NOT NULL,
    FOREIGN KEY (citing_paper_id) REFERENCES papers (id),
    FOREIGN KEY (cited_paper_id) REFERENCES papers (id)
);

-- Insert sample papers
INSERT INTO papers (title, abstract, venue, year, citation_count) VALUES
('Attention Is All You Need', 
 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
 'NIPS', 2017, 25000),

('BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.',
 'NAACL', 2018, 18000),

('GPT-3: Language Models are Few-Shot Learners',
 'We show that scaling up language models greatly improves task-agnostic, few-shot performance, sometimes even reaching competitiveness with prior state-of-the-art fine-tuning approaches. Specifically, we train GPT-3, an autoregressive language model with 175 billion parameters, 10x more than any previous non-sparse language model.',
 'NeurIPS', 2020, 12000),

('ResNet: Deep Residual Learning for Image Recognition',
 'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions.',
 'CVPR', 2016, 35000),

('RoBERTa: A Robustly Optimized BERT Pretraining Approach',
 'Language model pretraining has led to significant performance gains but careful comparison between different approaches is challenging. Training is computationally expensive, often done on private datasets of different sizes, and, as we will show, hyperparameter choices have significant impact on the final results.',
 'arXiv', 2019, 8000),

('DistilBERT: A Distilled Version of BERT',
 'As Transfer Learning from large-scale pre-trained models becomes more prevalent in Natural Language Processing (NLP), operating these large models in on-the-edge and/or under computational constraints and limited resources raises challenging questions.',
 'NeurIPS', 2019, 5000),

('ALBERT: A Lite BERT for Self-supervised Learning of Language Representations',
 'Increasing model size when pretraining natural language representations often results in improved performance on downstream tasks. However, at some point further model increases become harder due to GPU/TPU memory limitations and longer training times.',
 'ICLR', 2019, 6000),

('GPT-2: Language Models are Unsupervised Multitask Learners',
 'Natural language processing tasks, such as question answering, machine translation, reading comprehension, and summarization, are typically approached with supervised learning on taskspecific datasets. We demonstrate that language models begin to learn these tasks without any explicit supervision when trained on a new dataset of millions of webpages called WebText.',
 'OpenAI', 2019, 9000),

('T5: Text-to-Text Transfer Transformer',
 'Transfer learning, where a model is first pre-trained on a data-rich task before being fine-tuned on a downstream task, has emerged as a powerful technique in natural language processing (NLP). The effectiveness of transfer learning has given rise to a diversity of approaches, methodology, and practice.',
 'JMLR', 2019, 7000),

('PaLM: Scaling Language Modeling with Pathways',
 'Large language models have been shown to achieve remarkable performance across a variety of natural language tasks using few-shot learning, which drastically reduces the number of task-specific training examples needed to adapt the model to a particular application.',
 'arXiv', 2022, 3000);

-- Insert authors
INSERT INTO authors (name) VALUES
('Ashish Vaswani'), ('Noam Shazeer'), ('Niki Parmar'),
('Jacob Devlin'), ('Ming-Wei Chang'), ('Kenton Lee'),
('Tom B. Brown'), ('Benjamin Mann'), ('Nick Ryder'),
('Kaiming He'), ('Xiangyu Zhang'), ('Shaoqing Ren'),
('Yinhan Liu'), ('Myle Ott'), ('Naman Goyal'),
('Victor Sanh'), ('Lysandre Debut'), ('Julien Chaumond'),
('Zhenzhong Lan'), ('Mingda Chen'), ('Sebastian Goodman'),
('Alec Radford'), ('Jeffrey Wu'), ('Rewon Child'),
('Colin Raffel'), ('Noam Shazeer'), ('Adam Roberts'),
('Aakanksha Chowdhery'), ('Sharan Narang'), ('Jacob Devlin');

-- Insert paper-author relationships
INSERT INTO paper_authors (paper_id, author_id, is_first_author) VALUES
-- Attention Is All You Need
(1, 1, 1), (1, 2, 0), (1, 3, 0),
-- BERT
(2, 4, 1), (2, 5, 0), (2, 6, 0),
-- GPT-3
(3, 7, 1), (3, 8, 0), (3, 9, 0),
-- ResNet
(4, 10, 1), (4, 11, 0), (4, 12, 0),
-- RoBERTa
(5, 13, 1), (5, 14, 0), (5, 15, 0),
-- DistilBERT
(6, 16, 1), (6, 17, 0), (6, 18, 0),
-- ALBERT
(7, 19, 1), (7, 20, 0), (7, 21, 0),
-- GPT-2
(8, 22, 1), (8, 23, 0), (8, 24, 0),
-- T5
(9, 25, 1), (9, 26, 0), (9, 27, 0),
-- PaLM
(10, 28, 1), (10, 29, 0), (10, 30, 0);

-- Insert citations
INSERT INTO citations (citing_paper_id, cited_paper_id) VALUES
-- BERT cites Attention Is All You Need
(2, 1),
-- GPT-3 cites Attention Is All You Need
(3, 1),
-- RoBERTa cites BERT
(5, 2),
-- DistilBERT cites BERT
(6, 2),
-- ALBERT cites BERT
(7, 2),
-- GPT-2 cites Attention Is All You Need
(8, 1),
-- T5 cites Attention Is All You Need
(9, 1),
-- PaLM cites Attention Is All You Need
(10, 1),
-- Additional citations for more complex networks
(3, 2),  -- GPT-3 cites BERT
(5, 1),  -- RoBERTa cites Attention Is All You Need
(6, 1),  -- DistilBERT cites Attention Is All You Need
(7, 1),  -- ALBERT cites Attention Is All You Need
(8, 2),  -- GPT-2 cites BERT
(9, 2),  -- T5 cites BERT
(10, 2), -- PaLM cites BERT
(10, 3); -- PaLM cites GPT-3

-- Sample queries for testing the database

-- 1. Find all papers by a specific author
-- SELECT p.title, p.year, p.venue 
-- FROM papers p 
-- JOIN paper_authors pa ON p.id = pa.paper_id 
-- JOIN authors a ON pa.author_id = a.id 
-- WHERE a.name = 'Ashish Vaswani';

-- 2. Find co-citations (papers that cite the same works)
-- SELECT DISTINCT p1.title as citing_paper, p2.title as cited_paper
-- FROM citations c1
-- JOIN citations c2 ON c1.cited_paper_id = c2.cited_paper_id
-- JOIN papers p1 ON c1.citing_paper_id = p1.id
-- JOIN papers p2 ON c2.citing_paper_id = p2.id
-- WHERE c1.citing_paper_id != c2.citing_paper_id
-- LIMIT 10;

-- 3. Find co-authorships (papers with shared authors)
-- SELECT DISTINCT p1.title as paper1, p2.title as paper2, a.name as shared_author
-- FROM paper_authors pa1
-- JOIN paper_authors pa2 ON pa1.author_id = pa2.author_id
-- JOIN papers p1 ON pa1.paper_id = p1.id
-- JOIN papers p2 ON pa2.paper_id = p2.id
-- JOIN authors a ON pa1.author_id = a.id
-- WHERE pa1.paper_id != pa2.paper_id
-- LIMIT 10;

-- 4. Get citation network for a specific paper
-- SELECT 
--     p1.title as citing_paper,
--     p2.title as cited_paper,
--     p1.year as citing_year,
--     p2.year as cited_year
-- FROM citations c
-- JOIN papers p1 ON c.citing_paper_id = p1.id
-- JOIN papers p2 ON c.cited_paper_id = p2.id
-- WHERE p1.id = 1 OR p2.id = 1;

-- 5. Find most cited papers
-- SELECT title, year, venue, citation_count
-- FROM papers
-- ORDER BY citation_count DESC
-- LIMIT 10;

-- 6. Find papers from a specific venue
-- SELECT title, year, citation_count
-- FROM papers
-- WHERE venue = 'NeurIPS'
-- ORDER BY year DESC;

-- 7. Find authors with most papers
-- SELECT a.name, COUNT(pa.paper_id) as paper_count
-- FROM authors a
-- JOIN paper_authors pa ON a.id = pa.author_id
-- GROUP BY a.id, a.name
-- ORDER BY paper_count DESC
-- LIMIT 10;
