import { Tool } from './base_tool.js';

export class BaseAgent {
  constructor({
    name,
    model = "gpt-5.1-mini",
    systemPrompt = "",
    tools = [],
  }) {
    this.name = name;
    this.model = model;
    this.system_prompt = systemPrompt;
    this.tools = tools;
  }

  step(query) {
    // single step of the ReAct loop
  }
  
  run(query) {
    // main ReAct loop
  }
}

