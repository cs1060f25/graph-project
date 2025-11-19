import { BaseAgent } from './base_agent.js';

export class QuerySubagent extends BaseAgent {
  constructor(...args) {
    super(...args);
  }

  step(query) {
    // single step of the query loop:
    // 1. orchestrator step 1 -- format queries
    // 2. orchestrator step 2 -- make parallel delegate tool calls
    // 3. delegate step 1 -- make searches
    // 3. orcehstrator step 3 -- format and return results
  }

  run(query) {
    // main query loop: literally just one step iteration
  }
}

