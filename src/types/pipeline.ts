export interface ConvertOptions {
  out: string;
  typescript: boolean;
  strict: boolean;
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
}

export interface PipelineStep {
  name: string;
  run(ctx: PipelineContext): Promise<PipelineContext>;
}