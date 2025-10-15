# Research Graph Explorer - Power User Edition

A multi-layer research graph exploration tool designed for power users (applied researchers, VCs, academics) with advanced filtering and analysis capabilities.

## Features

- **Multi-field Search**: Keywords, authors, and paper titles with autocomplete
- **Three-Layer Graph Analysis**:
  - Layer 1 (Shallow): Broad context, many connections (top 70% of edges)
  - Layer 2 (Medium): Tighter focus, higher confidence (top 40% of edges)
  - Layer 3 (Deep): Strongest connections only (top 10% of edges)
- **Interactive Controls**: Simple layer depth selector (1/2/3) for increasing graph depth
- **D3.js Visualization**: Force-directed graph rendering with drag & drop interactions
- **SQLite Persistence**: Save graphs, starred papers, and query presets

## Tech Stack

- **Frontend**: Next.js (React) with TypeScript
- **Backend**: Node.js with Express
- **Database**: SQLite with sqlite3
- **Graph Visualization**: D3.js
- **Styling**: Inline styles with modern design

## Installation

### Prerequisites
- Node.js 18+

### Backend Setup
```bash
cd p4/backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd p4/frontend
npm install
npm run dev
```

## Usage

1. **Search Interface**: Enter keywords, search for authors, or find specific papers
2. **Autocomplete**: Get suggestions as you type for authors and papers
3. **Generate Graph**: Create a multi-layer graph based on your search criteria
4. **Layer Controls**: 
   - Select Layer 1 (Shallow) for broad context with many connections
   - Select Layer 2 (Medium) for tighter focus with higher confidence
   - Select Layer 3 (Deep) for strongest connections only
5. **Interactive Graph**: Hover over nodes for detailed information, drag to reposition

## API Endpoints

- `GET /api/autocomplete?q={query}&type={papers|authors}` - Autocomplete suggestions
- `POST /api/search` - Multi-layer graph search
- `POST /api/save-graph` - Save user graphs
- `GET /api/user/{userId}` - Get user data

## Graph Layers

### Layer 1 (Shallow)
- **Threshold**: Top 70% of edge scores
- **Purpose**: Broad context, many connections
- **Use Case**: Getting an overview of the research landscape

### Layer 2 (Medium)  
- **Threshold**: Top 40% of edge scores
- **Purpose**: Tighter focus, higher confidence
- **Use Case**: Focusing on more relevant connections

### Layer 3 (Deep)
- **Threshold**: Top 10% of edge scores  
- **Purpose**: Strongest connections only
- **Use Case**: Finding the most important relationships

## Development

The application uses a microservice-like architecture with separate endpoints for different analysis layers, allowing for easy scaling and optimization of each component.
