import sqlite3

DATABASE = 'research_graph.db'

def seed_database():
    """Add sample papers and citations"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Sample papers about AI/ML
    papers = [
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
    
    # Insert papers
    paper_ids = []
    for paper in papers:
        cursor.execute('''
            INSERT INTO papers (title, authors, abstract, year, url, keywords)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            paper['title'],
            paper['authors'],
            paper['abstract'],
            paper['year'],
            paper['url'],
            paper['keywords']
        ))
        paper_ids.append(cursor.lastrowid)
    
    # Add citations (who cites whom)
    # BERT cites Transformer
    cursor.execute('INSERT INTO citations (citing_paper_id, cited_paper_id) VALUES (?, ?)', 
                   (paper_ids[1], paper_ids[0]))
    
    # GPT-3 cites Transformer
    cursor.execute('INSERT INTO citations (citing_paper_id, cited_paper_id) VALUES (?, ?)', 
                   (paper_ids[2], paper_ids[0]))
    
    # GPT-3 cites BERT
    cursor.execute('INSERT INTO citations (citing_paper_id, cited_paper_id) VALUES (?, ?)', 
                   (paper_ids[2], paper_ids[1]))
    
    # Transformer cites Attention mechanism paper
    cursor.execute('INSERT INTO citations (citing_paper_id, cited_paper_id) VALUES (?, ?)', 
                   (paper_ids[0], paper_ids[6]))
    
    # ResNet cites AlexNet
    cursor.execute('INSERT INTO citations (citing_paper_id, cited_paper_id) VALUES (?, ?)', 
                   (paper_ids[3], paper_ids[5]))
    
    # GNN paper cites GAN
    cursor.execute('INSERT INTO citations (citing_paper_id, cited_paper_id) VALUES (?, ?)', 
                   (paper_ids[7], paper_ids[4]))
    
    # GNN paper cites ResNet
    cursor.execute('INSERT INTO citations (citing_paper_id, cited_paper_id) VALUES (?, ?)', 
                   (paper_ids[7], paper_ids[3]))
    
    conn.commit()
    conn.close()
    
    print(f"Successfully seeded database with {len(papers)} papers and multiple citations!")

if __name__ == '__main__':
    seed_database()
