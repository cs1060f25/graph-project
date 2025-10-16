DROP TABLE IF EXISTS papers;

CREATE TABLE papers (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  authors VARCHAR(500) NOT NULL,
  year INTEGER NOT NULL,
  arxiv_id VARCHAR(50) NOT NULL UNIQUE,
  topic VARCHAR(100) NOT NULL,
  citations INTEGER DEFAULT 0,
  summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_papers_topic ON papers(topic);
CREATE INDEX idx_papers_citations ON papers(citations DESC);
CREATE INDEX idx_papers_year ON papers(year DESC);