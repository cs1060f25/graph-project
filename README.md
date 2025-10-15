# Research Graph Explorer (Graphene MVP)

A minimalist web application for visualizing and exploring research paper citation networks. Built with Flask, SQLite, and D3.js with a beautiful graphite theme.

**Description**: There is a lot of tribal knowledge concerning finding the best research papers: hundreds are submitted each day, many of which are garbage. This application provides a way for you to graphically search through the most impactful or projected research relative to your interests and needs.

## Features

- **Interactive Graph Visualization**: Beautiful force-directed graph showing papers as nodes and citations as edges
- **Paper Management**: Add, search, and view research papers with metadata
- **Citation Tracking**: Visualize which papers cite each other
- **Search Functionality**: Search papers by title, author, keywords, or abstract
- **Minimalist Design**: Clean graphite-themed interface with no gradients
- **Responsive Layout**: Split view with graph visualization and paper details sidebar

## Tech Stack

- **Backend**: Flask (Python)
- **Database**: SQLite
- **Frontend**: HTML, CSS, JavaScript
- **Visualization**: D3.js v7
- **Theme**: Custom graphite minimalist design

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- WSL (Windows Subsystem for Linux) if on Windows

### Installation

1. **Navigate to the project directory in WSL**:
   ```bash
   cd /mnt/c/Users/ivang/Documents/github/graph-project
   ```

2. **Create a virtual environment**:
   ```bash
   python3 -m venv venv
   ```

3. **Activate the virtual environment**:
   ```bash
   source venv/bin/activate
   ```

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Seed the database with sample data**:
   ```bash
   python seed_data.py
   ```

6. **Run the application**:
   ```bash
   python app.py
   ```

7. **Open your browser** and navigate to:
   ```
   http://localhost:5000
   ```

## Usage

### Viewing Papers

- The sidebar shows all papers in the database
- Click on any paper to view its details
- The graph visualizes the citation network

### Searching

- Use the search bar to find papers by title, author, keywords, or abstract
- Click "Reset View" to clear the search and show all papers

### Graph Interaction

- **Click** on nodes to view paper details
- **Drag** nodes to rearrange the graph
- **Scroll** to zoom in/out
- **Click and drag** the background to pan

### API Endpoints

The application provides the following REST API endpoints:

- `GET /api/papers` - Get all papers
- `GET /api/papers/<id>` - Get a specific paper
- `POST /api/papers` - Add a new paper
- `POST /api/citations` - Add a citation relationship
- `GET /api/graph` - Get graph data (nodes and links)
- `GET /api/search?q=<query>` - Search papers
- `GET /api/related/<id>` - Get papers related to a specific paper

## Project Structure

```
graph-project/
├── app.py                 # Flask application and API endpoints
├── seed_data.py          # Database seeding script
├── requirements.txt      # Python dependencies
├── research_graph.db     # SQLite database (created on first run)
├── templates/
│   └── index.html        # Main HTML template
└── static/
    ├── style.css         # Graphite theme styles
    └── script.js         # Graph visualization and interaction logic
```

## Database Schema

### Papers Table
- `id`: Primary key
- `title`: Paper title
- `authors`: Paper authors
- `abstract`: Paper abstract
- `year`: Publication year
- `url`: Link to paper
- `keywords`: Comma-separated keywords
- `created_at`: Timestamp

### Citations Table
- `id`: Primary key
- `citing_paper_id`: Foreign key to papers
- `cited_paper_id`: Foreign key to papers

## Design Philosophy

This MVP follows a minimalist approach:

- **Graphite Theme**: Dark grays and charcoal colors (#1a1a1a, #2a2a2a, #3a3a3a)
- **No Gradients**: Flat, solid colors throughout
- **Clean Typography**: System fonts for optimal readability
- **Functional First**: Focus on core features that solve the user's problem
- **Beautiful Graphs**: D3.js force-directed layout with smooth interactions

## Future Enhancements

Potential features for future iterations:

- Import papers from arXiv API
- Calculate paper impact scores (PageRank-style)
- Community detection in citation networks
- Export graph visualizations
- User accounts and saved searches
- Collaborative annotations
- Integration with reference managers

## Original Project Links

Link: https://drive.google.com/drive/folders/1ils67r6OZdDwiRTr5ZC19TXRTMHw6Yrr?usp=share_link

## License

MIT License - Feel free to use and modify as needed.