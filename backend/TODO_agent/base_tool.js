export class Tool {
  constructor(name, description, schema, func) {
    this.name = name;
    this.description = description;
    this.schema = schema;
    this.func = func;
  }

  call(...args) {
    return this.func(...args);
  }
}

