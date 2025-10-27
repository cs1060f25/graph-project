## BACKGROUND 
The cache DB is responsible for keep track of all user data and raw information that is immediately relevant to the present state of the application frontend, including things like recently searched papers, potential action or further search suggestions, and metadata like user interactions, search queries, previously viewed or saved papers, etc. It will be linked to users based on unique identifiers based on the authentication provided by the User DB (GRAPH-24) in order to ensure that each user’s preferences and cache are securely tied to their account in order to provide a solid, predictive user experience.

## IMPLEMENTATION DESCRIPTION
1. Create a new interface within cacheInterface.js that sufficiently interfaces with the Firebase.
2. Implement event listeners and database service, including:
    - paperSavedListener
    - queryListener
    - CRU for recentPapers
    - CRU for recentQueries

## TESTING
All tests will be located in the `tests/cache-interface/` folder. Tests will be focussed on testing the following questions:
- Do each of the CRU operations work?
- Do the event listeners (with mock input events) successfully create events within the Firebase + Firestore documents are created correctly?
