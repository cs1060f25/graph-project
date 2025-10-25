# API Handler Component

This folder contains wrappers for external research APIs used by GRAPHENE.

## Structure
Each API has its own class file. Example:
- `ArxivAPI.js` — pre-printed CS, math, physics, quantitative biology
- `SemanticScholar.js` — peer-reviewed CS, math, engineering, social science, medicine

### Example Usage

```js
import PubMedAPI from "./api-handler/PubMedAPI.js";

const pubmed = new PubMedAPI();
const results = await pubmed.queryByKeyword("cancer immunotherapy", 5);
console.log(results[0]);

## Wrapper Functions

| Function | Parameters | Description | Returns |
|-----------|-------------|--------------|----------|
| `queryByTopic(topic, maxResults)` | `topic`: string — Arxiv category (e.g. "cs.AI") <br>`maxResults`: number (optional) | Queries papers by research category | Array of normalized paper objects |
| `queryByKeyword(keyword, maxResults)` | `keyword`: string <br>`maxResults`: number (optional) | Searches for papers by keyword | Array of normalized paper objects |

### Return Object Format
Each API returns results in this consistent format:

```json
[
  {
    "id": "https://arxiv.org/abs/1234.5678",
    "title": "Paper Title",
    "summary": "Abstract text...",
    "published": "2024-03-12T00:00:00Z",
    "authors": ["Author One", "Author Two"],
    "link": "https://arxiv.org/abs/1234.5678"
  }
]
