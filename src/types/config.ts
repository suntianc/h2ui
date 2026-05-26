export interface H2uiConfig {
  out?: string;
  typescript?: boolean;
  strict?: boolean;
  split?: boolean;
  cssMode?: 'module' | 'scoped' | 'inline' | 'global';
  framework?: 'react' | 'vue3';
}
