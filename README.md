# graph-project
Project Name: Graphene
<br><br>
Description: There is a lot of tribal knowledge concerning finding the best research papers: hundreds are submitted each day, many of which are garbage.  This application provides a way for you to graphically search through the most impactful or projected research relative to your interests and needs.
<br><br>
Link: https://drive.google.com/drive/folders/1ils67r6OZdDwiRTr5ZC19TXRTMHw6Yrr?usp=share_link

## Development: start Next.js app (both are now looped together because of Next's server-side functionality)

1. Install dependencies:
```bash
cd graphene && npm i
```

2. Start Next.js app:
```bash
npm start # in `graphene/`
```

## Implementation structure
- `app/` -- Next.js app router functionality. Holds all frontend and Next.js API routes (all logic and implementation is described below)
- `pages/`, `components/`, `styles/`, `public/` -- All direct frontend logic. Mostly componentized i.e. pages are composed from components and styled using styles, with assets being in public.
- `lib/` -- All backend services, logic, etc.
    - `auth/` -- Firebase auth handling (token verification, OAuth, etc.)
    - `config/` -- Env var handling, specifically for Firebase.
    - `contexts/` -- AuthContext manager for route protection and passing in authenticated user information.
    - `hooks/` -- As in the previous implementation, for query history and saved papers.
    - `logic/` -- Business logic that composes different services and operations. In between the API and the base atomised services.
    - `services/` -- Basic atomised services and ops for e.g. DB, Arxiv, OpenAlex, Core, etc.
    - `utils/` -- General utils and data manipulation (mainly for graph).
    - `models/` -- All data models + validation logic.