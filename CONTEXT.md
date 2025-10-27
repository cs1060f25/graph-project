## BACKGROUND 
The cache DB is responsible for keep track of all user data and raw information that is immediately relevant to the present state of the application frontend, including things like recently searched papers, potential action or further search suggestions, and metadata like user interactions, search queries, previously viewed or saved papers, etc. It will be linked to users based on unique identifiers based on the authentication provided by the User DB (GRAPH-24) in order to ensure that each user’s preferences and cache are securely tied to their account in order to provide a solid, predictive user experience.

## IMPLEMENTATION DESCRIPTION
1. Create a new Firebase project with a new collection titled `user-cache`.
2. Create a series of subcollections for the new collection as follows:
    - `recentPapers`: Recent papers and associated metadata (including user actions such as view/click or save).
    - `recentQueries`: Recent queries and associated metadata (including user actions such as extended search, save, folder creation, etc.).
3. Define data schemas (with the help of generative AI) in order to ensure that all information that is necessary re: papers or queries is stored.
4. Implement an interface using the provided `serviceAccountKey.json` that's able to read and write with validation to the database.
4. Validate implementations, read-write operations, and overall schemas.

## TESTING
All tests will be located in the tests/cache-db/ folder.

Tests should target the following two questions:
- Can the Firebase be basically accessed?
- Is there basic validation for the introduced schemas for each of the subcollections within the user-cache collection?

