export class Paper {
    paper_id;
    title;
    summary;
    published;
    authors;
    link;
    source;
    similarity;
    constructor(paperId, title, summary, published, authors, link, source, similarity) {
        this.paper_id = paperId;
        this.title = title;
        this.summary = summary;
        this.published = published;
        this.authors = authors;
        this.link = link;
        this.source = source;
        this.similarity = similarity;
    }
    toDict() {
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
    static fromDict(data) {
        return new Paper(data.paper_id, data.title, data.summary, data.published, data.authors, data.link, data.source, data.similarity);
    }
}
//# sourceMappingURL=paper.js.map