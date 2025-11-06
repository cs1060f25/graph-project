# Graphene Development Guide

## Quick Start

### Run Both Client & Server Concurrently

From the project root:

```bash
npm install  # First time only
npm start    # Starts both server and client
```

This will start:
- **SERVER** on `http://localhost:5000` (Mock mode - no Firebase needed)
- **CLIENT** on `http://localhost:3000` (React app with graph visualization)

### Individual Commands

**Server only:**
```bash
cd server
npm start        # Mock server (recommended for development)
npm run start:prod  # Real server (requires Firebase credentials)
```

**Client only:**
```bash
cd client/graph-project-react-app
npm start
```

## Server Modes

### Mock Mode (Default)
- **File:** `server/index.mock.js`
- **No Firebase credentials required**
- Uses hardcoded mock data
- Perfect for frontend development
- All API endpoints work with fake data

### Production Mode
- **File:** `server/index.js`
- **Requires Firebase service account**
- Real database operations
- Use when Firebase is configured

## Available API Endpoints

All endpoints are prefixed with `http://localhost:5000`

- `GET  /health` - Health check
- `GET  /api` - API info
- `GET  /api/user/me` - Current user
- `GET  /api/user/papers` - Get saved papers
- `POST /api/user/papers` - Save a paper
- `GET  /api/user/folders` - Get folders
- `POST /api/user/folders` - Create folder
- `GET  /api/user/data` - Get user data
- `GET  /api/user/history` - Get query history
- `POST /api/user/history` - Add query to history
- `DELETE /api/user/history` - Clear query history

## Project Structure

```
graph-project/
├── client/
│   └── graph-project-react-app/    # React frontend with graph viz
├── server/
│   ├── index.js                    # Production server (Firebase)
│   ├── index.mock.js              # Mock server (no Firebase)
│   ├── routes/                    # API routes
│   ├── user-db-interface/         # Database interface layer
│   └── user-db-component/         # Firebase components
└── package.json                   # Root - runs both concurrently
```

## Graph Visualization Features

The enhanced graph view includes:

- **Node sizing by popularity** - More connected papers appear larger
- **Click interaction** - Click any node to see full paper details
- **Clean, minimalist design** - Matches the Graphene theme
- **Smooth animations** - Slide-in panels and hover effects
- **Mobile responsive** - Detail panel slides up on mobile
- **Interactive controls** - Drag, zoom, and pan

## Development Tips

1. **Use Mock Server** - Develop frontend without Firebase setup
2. **Hot Reload** - Both client and server support live reload
3. **Concurrent Logs** - See both server and client output in one terminal
4. **Color-Coded Output** - Blue for SERVER, Green for CLIENT

## Testing

```bash
cd client/graph-project-react-app
npm test
```

## Building for Production

```bash
npm run build
```

This creates an optimized production build in `client/graph-project-react-app/build/`

## Troubleshooting

**Port already in use:**
```bash
fuser -k 5000/tcp  # Kill process on port 5000
fuser -k 3000/tcp  # Kill process on port 3000
```

**Server won't start with Firebase errors:**
Switch to mock mode (already default) or configure Firebase credentials.

**Graph not rendering:**
Check browser console for errors and ensure API is returning paper data.
