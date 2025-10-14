# Research Graph Explorer - Prototype 2

An advanced multi-page web application for discovering research papers through co-citation and co-authorship networks. This prototype focuses on paper/author-based search with sophisticated relationship analysis for experienced researchers.

## Features

- **Paper/Author-based Search**: Search for specific papers or researchers with autocomplete
- **Co-citation Analysis**: Discover papers that cite similar works, revealing topical clusters
- **Co-authorship Analysis**: Explore research collaborations and author networks
- **D3.js Graph Visualization**: Interactive network visualization with filtering capabilities
- **Multi-page Architecture**: Separate search and visualization interfaces
- **SQLite Database**: Persistent storage with proper relational data modeling
- **Advanced UI**: Professional interface designed for experienced researchers

## Tech Stack

- **Frontend**: React with D3.js for graph visualization
- **Backend**: Flask with SQLAlchemy
- **Database**: SQLite with relational schema
- **Architecture**: Multi-page web application

## Getting Started

### Prerequisites

- Python 3.8 or higher
- pip

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd graph-project
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

### Running the Application

1. Start the Flask server:
```bash
python app.py
```

2. Open your browser and navigate to `http://localhost:5001`

The application will automatically initialize the SQLite database with sample data on first run.

## Project Structure

```
graph-project/
├── app.py                 # Flask application with API endpoints
├── requirements.txt       # Python dependencies
├── sample_data.sql       # SQL schema and sample data
├── init_db.py            # Database initialization script
├── README.md             # This file
├── venv/                 # Python virtual environment
├── research_papers.db    # SQLite database (created on first run)
├── templates/
│   └── index.html        # Main HTML template
└── static/
    ├── css/
    │   └── main.css      # Application styles
    └── js/
        └── components/   # React components
            ├── App.js
            ├── SearchPage.js
            └── GraphPage.js
```

## Usage

1. **Search**: Start typing a paper title or author name to see autocomplete suggestions
2. **Select**: Choose a paper from the suggestions to explore its citation network
3. **Visualize**: View the graph showing co-citations and co-authorships
4. **Filter**: Use the filter buttons to focus on specific relationship types
5. **Explore**: Click on nodes to see paper details and understand connections

## Sample Searches

Try searching for these papers or authors:
- "Attention Is All You Need"
- "BERT"
- "ResNet"
- "Ashish Vaswani"
- "Kaiming He"

## Database Schema

The SQLite database contains the following tables:
- **Papers**: Research papers with titles, abstracts, venues, and years
- **Authors**: Author information with unique names
- **PaperAuthors**: Many-to-many relationship between papers and authors
- **Citations**: Citation relationships between papers

### Sample Data

The `sample_data.sql` file contains:
- 10 research papers from AI/ML domain (Transformers, BERT, GPT, ResNet, etc.)
- 30 authors with proper relationships
- Citation networks showing co-citation patterns
- Sample queries for testing the database

### Database Initialization

The database is automatically created and populated when you first run the Flask app. You can also manually initialize it:

```bash
# Activate virtual environment
source venv/bin/activate

# Initialize database from SQL file
python init_db.py
```

## Architecture

### Backend (`app.py`)
- Flask server with basic SQLite integration
- RESTful API endpoints for search and graph data
- Automatic database initialization with sample data
- Co-citation and co-authorship analysis algorithms

### Frontend (`static/js/components/`)
- React components for multi-page architecture
- D3.js for advanced graph visualization
- Autocomplete search with paper/author suggestions
- Interactive filtering and node selection

### Graph Logic
- **Co-citation**: Papers that cite the same works (blue edges)
- **Co-authorship**: Papers with shared authors (green edges)
- **Both**: Papers connected by both relationships (purple edges)
- Force-directed layout with collision detection

## API Endpoints

- `GET /api/search/autocomplete?q=<query>` - Get autocomplete suggestions
- `GET /api/search/paper?id=<paper_id>` - Get paper details and relationships
- `GET /api/search/author?id=<author_id>` - Get author details and papers
- `GET /api/graph/paper/<paper_id>` - Get graph data for visualization

## Development Notes

- Designed for experienced researchers as the primary user persona
- Focus on sophisticated relationship analysis and professional visualization
- SQLite database provides persistent storage and realistic data modeling
- D3.js enables advanced graph interactions and custom visualizations

## Troubleshooting

- Ensure Python dependencies are installed: `pip install -r requirements.txt`
- Database is automatically created on first run
- Check browser console for JavaScript errors
- Application works best with modern browsers supporting ES6+
Project Name: Graphene
<br><br>
Description: There is a lot of tribal knowledge concerning finding the best research papers: hundreds are submitted each day, many of which are garbage.  This application provides a way for you to graphically search through the most impactful or projected research relative to your interests and needs.
<br><br>
Link: https://drive.google.com/drive/folders/1ils67r6OZdDwiRTr5ZC19TXRTMHw6Yrr?usp=share_link
