export interface PaperDict {
  paper_id: string;
  title: string;
  summary: string;
  published: string;
  authors: string[];
  link: string;
  source?: string; // 'arxiv', 'core', 'openalex'
  similarity?: number; // Added for semantic reranking
}

export class Paper {
  paper_id: string;
  title: string;
  summary: string;
  published: string;
  authors: string[];
  link: string;
  source?: string;
  similarity?: number;

  constructor(
    paperId: string,
    title: string,
    summary: string,
    published: string,
    authors: string[],
    link: string,
    source?: string,
    similarity?: number
  ) {
    this.paper_id = paperId;
    this.title = title;
    this.summary = summary;
    this.published = published;
    this.authors = authors;
    this.link = link;
    this.source = source;
    this.similarity = similarity;
  }

  toDict(): PaperDict {
    return {
      paper_id: this.paper_id,
      title: this.title,
      summary: this.summary,
      published: this.published,
      authors: this.authors,
      link: this.link,
      source: this.source,
      similarity: this.similarity
    };
  }

  static fromDict(data: PaperDict): Paper {
    return new Paper(
      data.paper_id,
      data.title,
      data.summary,
      data.published,
      data.authors,
      data.link,
      data.source,
      data.similarity
    );
  }
}

