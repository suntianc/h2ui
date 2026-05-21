export interface ConvertOptions {
  out: string;
  typescript: boolean;
  strict: boolean;
  cssMode?: 'module';
}

export interface PipelineContext {
  html: string;
  filePath: string;
  $?: any;
  code?: string;
  outputPath?: string;
  warnings: string[];
  errors: string[];
  options: ConvertOptions;

  // Phase 2: Component Splitting + CSS
  componentTree?: ComponentNode;
  repeatedPatterns?: Map<string, import('domhandler').Element[]>;
  components?: ComponentOutput[];
  cssFiles?: CSSFile[];
}

export interface PipelineStep {
  name: string;
  run(ctx: PipelineContext): Promise<PipelineContext>;
}

/** A node in the component tree */
export interface ComponentNode {
  name: string;           // PascalCase component name (e.g. "Header")
  tag: string;            // Source HTML tag (e.g. "header", "div")
  element: import('domhandler').Element;       // Reference to domhandler Element
  children: ComponentNode[];
  isRepeated: boolean;    // True if extracted from repeated pattern
  repeatCount?: number;   // How many instances of this pattern
  cssProperties: Record<string, string>;  // Extracted CSS props
}

/** Per-component code output */
export interface ComponentOutput {
  name: string;           // Component name
  code: string;           // Full TSX/JSX component code
  cssProperties: Record<string, string>;  // CSS properties to write
}

/** Generated CSS file */
export interface CSSFile {
  name: string;           // 'shared' or component name
  css: string;            // CSS string content
}

/** Result of the split step */
export interface SplitResult {
  root: ComponentNode;    // Root of component tree
  flatList: ComponentNode[];  // Flat list of all components
}