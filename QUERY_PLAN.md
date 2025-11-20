# WORKFLOW
## INITIAL QUERY
### LLM
1. take in user natural language query
2. use tool-based agent with simple system prompt to turn this into $k$ $orthogonal queries in order to build the graph
3. query Arxiv and OpenAlex; return structured outputs

### DETERMINISTIC
4. rank by semantic similarity to original language query
5. build graph nodes (gradient) based on similarity to the original user query
    a. improvement: can clean up this user query to ensure semantic similarity works as best as possible

## FOLLOWUP QUERIES
### LLM
1. take in user NL query
2. inject previous searches and returned results (one-liners)
3. use these to inform PC queries
4. query Arxiv and OpenAlex

### DETERMINISTIC
same as above

# COMPONENTS
<!-- - [ ] new interfaces + history tracking in terms of "conversation threads" instead of past query history
- [ ] Chat/LLM wrapper agent (main agent)
    - [ ] system prompt
    > *NOTE: the agent's goal is to build a graph of orthogonal but related papers with its queries* -- multi-epoch querying? let's keep it simple for now
    - [ ] agentic loop
    - [x] tool schemas: search_arxiv and search_openalex
- [ ] pass actions into a mini LLM to get suggestions
** this will be such a time sink, can we somehow do better? - [ ] async/efficient semantic similarity analysis per paper
- [ ] graph data structure/data model (?) -->

CURRENT: refactored into Next.js + working backend + separation of concerns (basically, we are back to where we were before just cleaner)

NEXT:
- [ ] rebase and add new functionalities
- [ ] working LLM-augmented queries
    - [ ] efficient semantic similarity calculation
- [ ] new interfaces for history and graph
- [ ] LLM chat/search agent instead of basic search engine
- [ ] suggestions popup in the bottom right (miniLLM)