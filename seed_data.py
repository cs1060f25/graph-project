import sqlite3

DATABASE = 'research_graph.db'


def get_or_create_paper(cursor, paper):
    """Return paper id if exists by title, else insert and return new id."""
    cursor.execute('SELECT id FROM papers WHERE title = ? LIMIT 1', (paper['title'],))
    row = cursor.fetchone()
    if row:
        return row[0]
    cursor.execute(
        '''INSERT INTO papers (title, authors, abstract, year, url, keywords)
           VALUES (?, ?, ?, ?, ?, ?)''',
        (
            paper['title'],
            paper.get('authors', ''),
            paper.get('abstract', ''),
            paper.get('year'),
            paper.get('url', ''),
            paper.get('keywords', ''),
        )
    )
    return cursor.lastrowid


def insert_citation(cursor, citing_id, cited_id):
    """Insert citation if not exists."""
    cursor.execute(
        'INSERT OR IGNORE INTO citations (citing_paper_id, cited_paper_id) VALUES (?, ?)',
        (citing_id, cited_id),
    )


def seed_database():
    """Add sample papers and citations (idempotent)."""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Core starter papers about AI/ML (existing set)
    base_papers = [
        {
            'title': 'Attention Is All You Need',
            'authors': 'Vaswani et al.',
            'abstract': 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.',
            'year': 2017,
            'url': 'https://arxiv.org/abs/1706.03762',
            'keywords': 'transformer, attention, neural networks'
        },
        {
            'title': 'BERT: Pre-training of Deep Bidirectional Transformers',
            'authors': 'Devlin et al.',
            'abstract': 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers.',
            'year': 2018,
            'url': 'https://arxiv.org/abs/1810.04805',
            'keywords': 'BERT, transformers, language models, NLP'
        },
        {
            'title': 'GPT-3: Language Models are Few-Shot Learners',
            'authors': 'Brown et al.',
            'abstract': 'We show that scaling up language models greatly improves task-agnostic, few-shot performance.',
            'year': 2020,
            'url': 'https://arxiv.org/abs/2005.14165',
            'keywords': 'GPT, language models, few-shot learning'
        },
        {
            'title': 'Deep Residual Learning for Image Recognition',
            'authors': 'He et al.',
            'abstract': 'We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously.',
            'year': 2015,
            'url': 'https://arxiv.org/abs/1512.03385',
            'keywords': 'ResNet, computer vision, deep learning'
        },
        {
            'title': 'Generative Adversarial Networks',
            'authors': 'Goodfellow et al.',
            'abstract': 'We propose a new framework for estimating generative models via an adversarial process.',
            'year': 2014,
            'url': 'https://arxiv.org/abs/1406.2661',
            'keywords': 'GAN, generative models, adversarial training'
        },
        {
            'title': 'ImageNet Classification with Deep Convolutional Neural Networks',
            'authors': 'Krizhevsky et al.',
            'abstract': 'We trained a large, deep convolutional neural network to classify the 1.2 million high-resolution images in the ImageNet LSVRC-2010 contest.',
            'year': 2012,
            'url': 'https://papers.nips.cc/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b',
            'keywords': 'AlexNet, CNN, computer vision, ImageNet'
        },
        {
            'title': 'Neural Machine Translation by Jointly Learning to Align and Translate',
            'authors': 'Bahdanau et al.',
            'abstract': 'We introduce an extension to the encoder-decoder model which learns to align and translate jointly.',
            'year': 2014,
            'url': 'https://arxiv.org/abs/1409.0473',
            'keywords': 'attention mechanism, machine translation, sequence-to-sequence'
        },
        {
            'title': 'Graph Neural Networks: A Review of Methods and Applications',
            'authors': 'Zhou et al.',
            'abstract': 'This paper provides a comprehensive review of graph neural networks in recent years.',
            'year': 2020,
            'url': 'https://arxiv.org/abs/1812.08434',
            'keywords': 'GNN, graph networks, deep learning'
        }
    ]
    # Insert/get ids for base papers
    base_ids = []
    for p in base_papers:
        base_ids.append(get_or_create_paper(cursor, p))

    # Add citations among base papers (idempotent)
    insert_citation(cursor, base_ids[1], base_ids[0])  # BERT -> Transformer
    insert_citation(cursor, base_ids[2], base_ids[0])  # GPT-3 -> Transformer
    insert_citation(cursor, base_ids[2], base_ids[1])  # GPT-3 -> BERT
    insert_citation(cursor, base_ids[0], base_ids[6])  # Transformer -> Bahdanau et al.
    insert_citation(cursor, base_ids[3], base_ids[5])  # ResNet -> AlexNet
    insert_citation(cursor, base_ids[7], base_ids[4])  # GNN Review -> GAN
    insert_citation(cursor, base_ids[7], base_ids[3])  # GNN Review -> ResNet

    # Additional graph/recsys/contrastive learning papers
    more_papers = [
        {
            'title': 'Semi-Supervised Classification with Graph Convolutional Networks',
            'authors': 'Kipf & Welling',
            'abstract': 'Introduces GCNs for semi-supervised node classification using spectral convolutions.',
            'year': 2016,
            'url': 'https://arxiv.org/abs/1609.02907',
            'keywords': 'GCN, semi-supervised, graphs'
        },
        {
            'title': 'Inductive Representation Learning on Large Graphs',
            'authors': 'Hamilton et al.',
            'abstract': 'Proposes GraphSAGE for inductive node embeddings via neighborhood sampling and aggregation.',
            'year': 2017,
            'url': 'https://arxiv.org/abs/1706.02216',
            'keywords': 'GraphSAGE, inductive, embeddings'
        },
        {
            'title': 'node2vec: Scalable Feature Learning for Networks',
            'authors': 'Grover & Leskovec',
            'abstract': 'Biased random walks for flexible network embeddings that interpolate between BFS and DFS.',
            'year': 2016,
            'url': 'https://arxiv.org/abs/1607.00653',
            'keywords': 'node2vec, embeddings, random walks'
        },
        {
            'title': 'DeepWalk: Online Learning of Social Representations',
            'authors': 'Perozzi et al.',
            'abstract': 'Introduces random-walk based node embeddings using SkipGram-like objectives.',
            'year': 2014,
            'url': 'https://arxiv.org/abs/1403.6652',
            'keywords': 'DeepWalk, embeddings, graphs'
        },
        {
            'title': 'LINE: Large-scale Information Network Embedding',
            'authors': 'Tang et al.',
            'abstract': 'Preserves first- and second-order proximities for large-scale network embeddings.',
            'year': 2015,
            'url': 'https://arxiv.org/abs/1503.03578',
            'keywords': 'LINE, embeddings, network'
        },
        {
            'title': 'Neural Collaborative Filtering',
            'authors': 'He et al.',
            'abstract': 'Replaces matrix factorization interaction with neural architectures for implicit feedback.',
            'year': 2017,
            'url': 'https://arxiv.org/abs/1708.05031',
            'keywords': 'recommender systems, NCF, implicit feedback'
        },
        {
            'title': 'LightGCN: Simplifying and Powering Graph Convolution Network for Recommendation',
            'authors': 'He et al.',
            'abstract': 'Simplifies GCN for collaborative filtering by removing transforms and nonlinearities.',
            'year': 2020,
            'url': 'https://arxiv.org/abs/2002.02126',
            'keywords': 'LightGCN, recommendation, GCN'
        },
        {
            'title': 'PinSage: Graph Convolutional Neural Networks for Web-Scale Recommender Systems',
            'authors': 'Ying et al.',
            'abstract': 'Efficient random-walk based convolutions for large-scale item graphs in recommendation.',
            'year': 2018,
            'url': 'https://arxiv.org/abs/1806.01973',
            'keywords': 'PinSage, recommendation, GCN'
        },
        {
            'title': 'Graph Contrastive Learning for Recommendation',
            'authors': 'Wu et al.',
            'abstract': 'Applies contrastive learning with graph augmentations to improve recommendation robustness.',
            'year': 2021,
            'url': 'https://arxiv.org/abs/2010.13902',
            'keywords': 'contrastive learning, recommendation, graphs'
        },
        {
            'title': 'Self-Supervised Graph Learning for Recommendation',
            'authors': 'Yu et al.',
            'abstract': 'Introduces self-supervised signals to enhance graph-based collaborative filtering.',
            'year': 2021,
            'url': 'https://arxiv.org/abs/2007.12865',
            'keywords': 'self-supervised, graphs, recommendation'
        },
        {
            'title': 'Momentum Contrast for Unsupervised Visual Representation Learning',
            'authors': 'He et al.',
            'abstract': 'MoCo proposes a dynamic dictionary with momentum encoder for contrastive learning.',
            'year': 2020,
            'url': 'https://arxiv.org/abs/1911.05722',
            'keywords': 'contrastive learning, MoCo'
        },
        {
            'title': 'A Simple Framework for Contrastive Learning of Visual Representations',
            'authors': 'Chen et al.',
            'abstract': 'SimCLR shows strong performance with simple augmentations and large batch training.',
            'year': 2020,
            'url': 'https://arxiv.org/abs/2002.05709',
            'keywords': 'SimCLR, contrastive learning'
        }
    ]

    more_ids = []
    for p in more_papers:
        more_ids.append(get_or_create_paper(cursor, p))

    # Build indices for easier referencing
    # base: 0 Transformer, 1 BERT, 2 GPT-3, 3 ResNet, 4 GAN, 5 AlexNet, 6 Bahdanau, 7 GNN Review
    (TRANS, BERT, GPT3, RESNET, GAN, ALEXNET, BAHDA, GNNREV) = base_ids

    # Unpack some new paper ids for readability
    GCN, GRAPHSAGE, NODE2VEC, DEEPWALK, LINE, NCF, LIGHTGCN, PINSAGE, GCLREC, SSGREC, MOCO, SIMCLR = more_ids

    # Citations among added set and to base
    insert_citation(cursor, NODE2VEC, DEEPWALK)
    insert_citation(cursor, LINE, DEEPWALK)
    insert_citation(cursor, GCN, GNNREV)
    insert_citation(cursor, GRAPHSAGE, GNNREV)
    insert_citation(cursor, PINSAGE, GRAPHSAGE)
    insert_citation(cursor, LIGHTGCN, GCN)
    insert_citation(cursor, NCF, ALEXNET)  # loose link to deep learning lineage
    insert_citation(cursor, GCLREC, LIGHTGCN)
    insert_citation(cursor, GCLREC, SIMCLR)
    insert_citation(cursor, SSGREC, LIGHTGCN)
    insert_citation(cursor, SSGREC, MOCO)
    insert_citation(cursor, PINSAGE, GCN)

    conn.commit()
    conn.close()
    
    total_added = len(base_papers) + len(more_papers)
    print(f"Seeding complete. Base + additional papers defined: {total_added}. Citations inserted idempotently.")

if __name__ == '__main__':
    seed_database()
