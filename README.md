# Research Graph Explorer - Prototype 1

A single-page React application for discovering research papers through interactive citation networks. This is the first prototype focusing on keyword-based search with direct citation relationships.

## Features

- **Keyword-based Search**: Search for research papers using topic-related keywords
- **Interactive Graph Visualization**: Explore papers through citation networks using React Flow
- **Direct Citation Edges**: Graph connections based on direct citations between papers
- **Paper Details Panel**: Click on any paper node to view detailed information
- **Responsive Design**: Clean, intuitive interface designed for novice researchers

## Tech Stack

- **Frontend**: React with React Flow for graph visualization
- **Backend**: Node.js with Express
- **Data**: Mock JSON data (no real database)
- **Architecture**: Single-page app, fully client-rendered

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd graph-project
```

2. Install server dependencies:
```bash
npm install
```

3. Install client dependencies:
```bash
cd client
npm install
cd ..
```

### Running the Application

1. Start the development server:
```bash
npm run dev
```

This will start both the backend server (port 5001) and the React development server (port 3000).

2. Open your browser and navigate to `http://localhost:3000`

### Alternative: Run separately

If you prefer to run the servers separately:

1. Start the backend server:
```bash
npm run server
```

2. In a new terminal, start the React client:
```bash
npm run client
```

## Usage

1. **Search**: Enter keywords related to your research topic (e.g., "transformer", "deep learning", "computer vision")
2. **Explore**: The graph will display papers as nodes connected by citation relationships
3. **Interact**: 
   - Click and drag nodes to rearrange the graph
   - Use the zoom and pan controls in the bottom-left
   - Click on any paper node to view detailed information in the side panel
4. **Navigate**: Use the minimap in the bottom-right to navigate large graphs

## Sample Queries

Try these keyword searches to explore the mock data:
- "transformer"
- "deep learning"
- "computer vision"
- "language models"
- "attention"

## Mock Data

The application uses mock data from `mockData.json` containing 13 research papers with citation relationships. The papers cover topics in:
- Natural Language Processing (Transformers, BERT, GPT)
- Computer Vision (ResNet, VGG, Inception)
- Deep Learning architectures

## Architecture

### Backend (`server.js`)
- Express server serving mock data
- Search API endpoint (`/api/search`) for keyword-based queries
- CORS enabled for development

### Frontend (`client/src/`)
- React application with React Flow integration
- Search interface with keyword input
- Interactive graph visualization
- Paper details panel

### Graph Logic
- Nodes represent research papers
- Edges represent direct citation relationships
- Papers are positioned randomly on initial load
- Citation edges are animated to show direction

## Future Prototypes

This is Prototype 1 of 4 planned prototypes. Future versions will explore:
- Different graph logic approaches (embeddings, similarity measures)
- Alternative search methods (paper names, authors)
- Enhanced user interfaces
- Different user personas and use cases

## Development Notes

- The application is designed for novice researchers as the primary user persona
- Focus is on simplicity and intuitive exploration rather than complex features
- Mock data provides a realistic testing environment without external API dependencies
- React Flow provides professional graph visualization capabilities

## Troubleshooting

- If the graph doesn't load, check that both servers are running
- If search returns no results, try broader keywords
- The application works best with modern browsers that support ES6+
Project Name: Graphene
<br><br>
Description: There is a lot of tribal knowledge concerning finding the best research papers: hundreds are submitted each day, many of which are garbage.  This application provides a way for you to graphically search through the most impactful or projected research relative to your interests and needs.
<br><br>
Link: https://drive.google.com/drive/folders/1ils67r6OZdDwiRTr5ZC19TXRTMHw6Yrr?usp=share_link
