const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8002;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// SQLite database setup
const dbPath = path.join(__dirname, 'research_graph.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create papers table
      db.run(`
        CREATE TABLE IF NOT EXISTS papers (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          authors TEXT NOT NULL,
          abstract TEXT,
          venue TEXT,
          year INTEGER,
          keywords TEXT NOT NULL,
          citations TEXT NOT NULL,
          cited_by TEXT NOT NULL,
          embedding TEXT
        )
      `);

      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          user_id TEXT UNIQUE NOT NULL,
          saved_graphs TEXT,
          starred_papers TEXT,
          presets TEXT
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}

// Initialize mock data
function initMockData() {
  return new Promise((resolve, reject) => {
    // Check if data already exists
    db.get("SELECT COUNT(*) as count FROM papers", (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row.count > 0) {
        console.log('Mock data already exists');
        resolve();
        return;
      }

      const mockPapers = [
        {
          id: 'p1',
          title: "Attention Is All You Need",
          authors: JSON.stringify(["Ashish Vaswani", "Noam Shazeer", "Niki Parmar"]),
          abstract: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...",
          venue: "NIPS",
          year: 2017,
          keywords: JSON.stringify(["transformer", "attention", "neural networks", "sequence modeling"]),
          citations: JSON.stringify([]),
          cited_by: JSON.stringify([]),
          embedding: JSON.stringify(Array.from({length: 384}, () => Math.random()))
        },
        {
          id: 'p2',
          title: "BERT: Pre-training of Deep Bidirectional Transformers",
          authors: JSON.stringify(["Jacob Devlin", "Ming-Wei Chang", "Kenton Lee"]),
          abstract: "We introduce a new language representation model called BERT...",
          venue: "NAACL",
          year: 2018,
          keywords: JSON.stringify(["bert", "transformer", "language understanding", "pre-training"]),
          citations: JSON.stringify(['p1']),
          cited_by: JSON.stringify([]),
          embedding: JSON.stringify(Array.from({length: 384}, () => Math.random()))
        },
        {
          id: 'p3',
          title: "GPT-3: Language Models are Few-Shot Learners",
          authors: JSON.stringify(["Tom B. Brown", "Benjamin Mann", "Nick Ryder"]),
          abstract: "We show that scaling up language models greatly improves task-agnostic, few-shot performance...",
          venue: "NeurIPS",
          year: 2020,
          keywords: JSON.stringify(["gpt", "transformer", "language models", "few-shot learning", "scaling"]),
          citations: JSON.stringify(['p1']),
          cited_by: JSON.stringify([]),
          embedding: JSON.stringify(Array.from({length: 384}, () => Math.random()))
        },
        {
          id: 'p4',
          title: "ResNet: Deep Residual Learning for Image Recognition",
          authors: JSON.stringify(["Kaiming He", "Xiangyu Zhang", "Shaoqing Ren"]),
          abstract: "Deeper neural networks are more difficult to train...",
          venue: "CVPR",
          year: 2016,
          keywords: JSON.stringify(["resnet", "deep learning", "computer vision", "residual networks"]),
          citations: JSON.stringify([]),
          cited_by: JSON.stringify([]),
          embedding: JSON.stringify(Array.from({length: 384}, () => Math.random()))
        },
        {
          id: 'p5',
          title: "Graph Neural Networks: A Review",
          authors: JSON.stringify(["Zonghan Wu", "Shirui Pan", "Fengwen Chen"]),
          abstract: "Graph neural networks (GNNs) are neural models that capture the dependence of graphs...",
          venue: "IEEE TKDE",
          year: 2020,
          keywords: JSON.stringify(["graph neural networks", "gnn", "transformer", "graph learning", "neural networks"]),
          citations: JSON.stringify([]),
          cited_by: JSON.stringify([]),
          embedding: JSON.stringify(Array.from({length: 384}, () => Math.random()))
        },
        {
          id: 'p6',
          title: "Deep Learning for Computer Vision",
          authors: JSON.stringify(["Yann LeCun", "Yoshua Bengio", "Geoffrey Hinton"]),
          abstract: "Deep learning has revolutionized computer vision with convolutional neural networks...",
          venue: "Nature",
          year: 2015,
          keywords: JSON.stringify(["deep learning", "computer vision", "cnn", "transformer", "neural networks"]),
          citations: JSON.stringify([]),
          cited_by: JSON.stringify([]),
          embedding: JSON.stringify(Array.from({length: 384}, () => Math.random()))
        },
        {
          id: 'p7',
          title: "Reinforcement Learning: An Introduction",
          authors: JSON.stringify(["Richard Sutton", "Andrew Barto"]),
          abstract: "Reinforcement learning is learning what to do—how to map situations to actions...",
          venue: "MIT Press",
          year: 2018,
          keywords: JSON.stringify(["reinforcement learning", "rl", "machine learning", "algorithms"]),
          citations: JSON.stringify([]),
          cited_by: JSON.stringify([]),
          embedding: JSON.stringify(Array.from({length: 384}, () => Math.random()))
        },
        {
          id: 'p8',
          title: "Vision Transformer: An Image is Worth 16x16 Words",
          authors: JSON.stringify(["Alexey Dosovitskiy", "Lucas Beyer", "Alexander Kolesnikov"]),
          abstract: "While the Transformer architecture has become the de-facto standard for natural language processing tasks...",
          venue: "ICLR",
          year: 2021,
          keywords: JSON.stringify(["vision transformer", "vit", "transformer", "computer vision", "image classification"]),
          citations: JSON.stringify(['p1']),
          cited_by: JSON.stringify([]),
          embedding: JSON.stringify(Array.from({length: 384}, () => Math.random()))
        },
        {
          id: 'p9',
          title: "Swin Transformer: Hierarchical Vision Transformer",
          authors: JSON.stringify(["Ze Liu", "Yutong Lin", "Yue Cao"]),
          abstract: "This paper presents a new vision Transformer, called Swin Transformer, that capably serves as a general-purpose backbone...",
          venue: "ICCV",
          year: 2021,
          keywords: JSON.stringify(["swin transformer", "transformer", "computer vision", "hierarchical", "image recognition"]),
          citations: JSON.stringify(['p8']),
          cited_by: JSON.stringify([]),
          embedding: JSON.stringify(Array.from({length: 384}, () => Math.random()))
        },
        {
          id: 'p10',
          title: "Neural Machine Translation by Jointly Learning to Align and Translate",
          authors: JSON.stringify(["Dzmitry Bahdanau", "Kyunghyun Cho", "Yoshua Bengio"]),
          abstract: "Neural machine translation is a recently proposed approach to machine translation...",
          venue: "ICLR",
          year: 2015,
          keywords: JSON.stringify(["neural machine translation", "attention", "nlp", "translation"]),
          citations: JSON.stringify(['p1']),
          cited_by: JSON.stringify([]),
          embedding: JSON.stringify(Array.from({length: 384}, () => Math.random()))
        }
      ];

      const stmt = db.prepare(`
        INSERT INTO papers (id, title, authors, abstract, venue, year, keywords, citations, cited_by, embedding)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let completed = 0;
      mockPapers.forEach(paper => {
        stmt.run([
          paper.id,
          paper.title,
          paper.authors,
          paper.abstract,
          paper.venue,
          paper.year,
          paper.keywords,
          paper.citations,
          paper.cited_by,
          paper.embedding
        ], (err) => {
          if (err) {
            console.error('Error inserting paper:', err);
          }
          completed++;
          if (completed === mockPapers.length) {
            stmt.finalize();
            console.log(`Mock data initialized with ${mockPapers.length} papers`);
            resolve();
          }
        });
      });
    });
  });
}

// API Routes

// Autocomplete for papers and authors
app.get('/api/autocomplete', (req, res) => {
  const { q, type } = req.query;
  if (!q || q.length < 2) return res.json([]);

  if (type === 'papers') {
    db.all(
      "SELECT id, title, authors, year, venue FROM papers WHERE title LIKE ? LIMIT 5",
      [`%${q}%`],
      (err, rows) => {
        if (err) {
          res.status(500).json({ error: 'Autocomplete failed' });
          return;
        }
        res.json(rows.map(row => ({
          id: row.id,
          title: row.title,
          authors: JSON.parse(row.authors),
          year: row.year,
          venue: row.venue
        })));
      }
    );
  } else if (type === 'authors') {
    db.all("SELECT authors FROM papers", (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Autocomplete failed' });
        return;
      }
      const allAuthors = rows.flatMap(row => JSON.parse(row.authors));
      const uniqueAuthors = [...new Set(allAuthors)];
      const filteredAuthors = uniqueAuthors
        .filter(author => author.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 5);
      res.json(filteredAuthors);
    });
  } else {
    res.json([]);
  }
});

// Helper functions for edge scoring
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function minMaxNormalize(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0);
  return values.map(v => (v - min) / (max - min));
}

// Multi-layer graph search with new edge scoring
app.post('/api/search', (req, res) => {
  const { keywords, authors, papers, layers } = req.body;
  const { alpha = 0.3, beta = 0.4, gamma = 0.3 } = layers || {};

  // Get all papers first
  db.all("SELECT * FROM papers", (err, allPapers) => {
    if (err) {
      res.status(500).json({ error: 'Search failed' });
      return;
    }

    // Parse JSON fields
    const parsedPapers = allPapers.map(paper => ({
      ...paper,
      authors: JSON.parse(paper.authors),
      keywords: JSON.parse(paper.keywords),
      citations: JSON.parse(paper.citations),
      cited_by: JSON.parse(paper.cited_by),
      embedding: JSON.parse(paper.embedding)
    }));

    // Filter papers based on search criteria
    let relevantPapers = parsedPapers;
    
    if (keywords && keywords.length > 0) {
      relevantPapers = relevantPapers.filter(paper => {
        return keywords.some(keyword => 
          paper.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase())) ||
          paper.title.toLowerCase().includes(keyword.toLowerCase()) ||
          paper.abstract.toLowerCase().includes(keyword.toLowerCase())
        );
      });
    }

    if (authors && authors.length > 0) {
      relevantPapers = relevantPapers.filter(paper => {
        return authors.some(author => 
          paper.authors.some(a => a.toLowerCase().includes(author.toLowerCase()))
        );
      });
    }

    if (papers && papers.length > 0) {
      relevantPapers = relevantPapers.filter(paper => papers.includes(paper.id));
    }

    // Calculate edge scores between all pairs of relevant papers
    const edgeScores = [];
    const allEdgeScores = [];

    for (let i = 0; i < relevantPapers.length; i++) {
      for (let j = i + 1; j < relevantPapers.length; j++) {
        const paperA = relevantPapers[i];
        const paperB = relevantPapers[j];

        // Mock similarity scores for demonstration
        const s_kw = Math.random() * 0.8 + 0.1; // 0.1 to 0.9
        const s_cite = Math.random() * 0.6 + 0.2; // 0.2 to 0.8  
        const s_sem = Math.random() * 0.7 + 0.15; // 0.15 to 0.85

        // Combined edge score: W_ij = α*S_kw + β*S_cite + γ*S_sem
        const edgeScore = alpha * s_kw + beta * s_cite + gamma * s_sem;
        
        console.log(`Edge ${paperA.id}-${paperB.id}: s_kw=${s_kw}, s_cite=${s_cite}, s_sem=${s_sem}, combined=${edgeScore}`);
        
        allEdgeScores.push(edgeScore);
        edgeScores.push({
          source: paperA.id,
          target: paperB.id,
          score: edgeScore,
          s_kw,
          s_cite,
          s_sem
        });
      }
    }

    // Normalize edge scores to [0, 1]
    let normalizedScores = [];
    if (allEdgeScores.length > 1) {
      normalizedScores = minMaxNormalize(allEdgeScores);
    } else if (allEdgeScores.length === 1) {
      normalizedScores = [0.5]; // Single edge gets middle score
    }
    
    edgeScores.forEach((edge, index) => {
      edge.normalizedScore = normalizedScores[index] || 0;
    });

    // Define thresholds for three layers (from strongest to weakest)
    let t1 = 0.1, t2 = 0.3, t3 = 0.6; // Default thresholds
    if (normalizedScores.length > 0) {
      const sortedScores = [...normalizedScores].sort((a, b) => b - a);
      t1 = sortedScores[Math.floor(sortedScores.length * 0.1)] || 0.1; // Layer 1: top 10% (strongest)
      t2 = sortedScores[Math.floor(sortedScores.length * 0.4)] || 0.3; // Layer 2: top 40% (strong + medium)
      t3 = sortedScores[Math.floor(sortedScores.length * 0.7)] || 0.6; // Layer 3: top 70% (all strong connections)
    }

    // Create nodes
    const nodes = relevantPapers.map(paper => ({
      id: paper.id,
      label: paper.title,
      authors: paper.authors,
      year: paper.year,
      venue: paper.venue,
      keywords: paper.keywords
    }));

    // Create edges with layer information
    const edges = edgeScores.map(edge => ({
      id: `${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      weight: edge.normalizedScore,
      layer1: edge.normalizedScore >= t1,
      layer2: edge.normalizedScore >= t2,
      layer3: edge.normalizedScore >= t3,
      scores: {
        s_kw: edge.s_kw,
        s_cite: edge.s_cite,
        s_sem: edge.s_sem,
        combined: edge.normalizedScore
      }
    }));

    res.json({
      query: { keywords, authors, papers },
      layers: { alpha, beta, gamma },
      thresholds: { t1, t2, t3 },
      nodes,
      edges,
      layerCounts: {
        layer1: edges.filter(e => e.layer1).length,
        layer2: edges.filter(e => e.layer2).length,
        layer3: edges.filter(e => e.layer3).length
      }
    });
  });
});

// Save graph
app.post('/api/save-graph', (req, res) => {
  const { userId, graphData } = req.body;
  
  db.get("SELECT * FROM users WHERE user_id = ?", [userId], (err, user) => {
    if (err) {
      res.status(500).json({ error: 'Save failed' });
      return;
    }

    const savedGraphs = user ? JSON.parse(user.saved_graphs || '[]') : [];
    savedGraphs.push(graphData);

    if (user) {
      db.run(
        "UPDATE users SET saved_graphs = ? WHERE user_id = ?",
        [JSON.stringify(savedGraphs), userId],
        (err) => {
          if (err) {
            res.status(500).json({ error: 'Save failed' });
          } else {
            res.json({ success: true, graphId: graphData._id });
          }
        }
      );
    } else {
      db.run(
        "INSERT INTO users (id, user_id, saved_graphs, starred_papers, presets) VALUES (?, ?, ?, ?, ?)",
        [userId, userId, JSON.stringify(savedGraphs), '[]', '[]'],
        (err) => {
          if (err) {
            res.status(500).json({ error: 'Save failed' });
          } else {
            res.json({ success: true, graphId: graphData._id });
          }
        }
      );
    }
  });
});

// Get user data
app.get('/api/user/:userId', (req, res) => {
  db.get("SELECT * FROM users WHERE user_id = ?", [req.params.userId], (err, user) => {
    if (err) {
      res.status(500).json({ error: 'Failed to fetch user data' });
      return;
    }
    
    if (user) {
      res.json({
        savedGraphs: JSON.parse(user.saved_graphs || '[]'),
        starredPapers: JSON.parse(user.starred_papers || '[]'),
        presets: JSON.parse(user.presets || '[]')
      });
    } else {
      res.json({ savedGraphs: [], starredPapers: [], presets: [] });
    }
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    await initMockData();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Using SQLite database');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startServer();