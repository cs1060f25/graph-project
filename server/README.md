# Graphene Server

Backend server for the Graphene research paper discovery platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file:
```bash
cp .env.example .env
```

3. Configure Firebase Admin:
   - Go to Firebase Console > Project Settings > Service accounts
   - Click "Generate new private key"
   - Copy the JSON content and set it as `FIREBASE_SERVICE_ACCOUNT` in your `.env` file

4. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3001`

## API Endpoints

- `POST /api/auth/bootstrap` - Verifies Firebase token and upserts user
- `GET /api/me` - Returns current user info (requires auth token)
- `GET /api/health` - Health check endpoint

## Environment Variables

- `PORT` - Server port (default: 3001)
- `FIREBASE_SERVICE_ACCOUNT` - Firebase Admin SDK service account JSON
