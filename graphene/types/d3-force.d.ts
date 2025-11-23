declare module 'd3-force' {
  export interface Simulation<NodeDatum> {
    nodes(nodes: NodeDatum[]): this;
    force(name: string, force: Force<NodeDatum> | null): this;
    alpha(alpha: number): this;
    alphaTarget(target: number): this;
    restart(): this;
    stop(): this;
    tick(iterations?: number): void;
    on(typenames: string, listener: (this: this, ...args: any[]) => void): this;
  }

  export interface Force<NodeDatum> {
    (alpha: number): void;
    initialize?(nodes: NodeDatum[], ...args: any[]): void;
  }

  export interface ForceLink<NodeDatum> extends Force<NodeDatum> {
    id(id: (node: NodeDatum, i: number, nodes: NodeDatum[]) => string | number): this;
    distance(distance: number | ((link: any, i: number, links: any[]) => number)): this;
    strength(strength: number | ((link: any, i: number, links: any[]) => number)): this;
    links(links: any[]): this;
  }

  export interface ForceManyBody<NodeDatum> extends Force<NodeDatum> {
    strength(strength: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)): this;
    distanceMin(distance: number): this;
    distanceMax(distance: number): this;
    theta(theta: number): this;
  }

  export interface ForceCollide<NodeDatum> extends Force<NodeDatum> {
    radius(radius: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)): this;
    strength(strength: number): this;
    iterations(iterations: number): this;
  }

  export interface ForceCenter<NodeDatum> extends Force<NodeDatum> {
    x(x: number): this;
    y(y: number): this;
    strength(strength: number): this;
  }

  export interface ForceX<NodeDatum> extends Force<NodeDatum> {
    x(x: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)): this;
    strength(strength: number): this;
  }

  export interface ForceY<NodeDatum> extends Force<NodeDatum> {
    y(y: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)): this;
    strength(strength: number): this;
  }

  export function forceSimulation<NodeDatum>(nodes?: NodeDatum[]): Simulation<NodeDatum>;
  export function forceLink<NodeDatum>(links?: any[]): ForceLink<NodeDatum>;
  export function forceManyBody<NodeDatum>(): ForceManyBody<NodeDatum>;
  export function forceCollide<NodeDatum>(radius?: number): ForceCollide<NodeDatum>;
  export function forceCenter<NodeDatum>(x?: number, y?: number): ForceCenter<NodeDatum>;
  export function forceX<NodeDatum>(x?: number): ForceX<NodeDatum>;
  export function forceY<NodeDatum>(y?: number): ForceY<NodeDatum>;
}

