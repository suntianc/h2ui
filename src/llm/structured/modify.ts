import { z } from 'zod';

export const ComponentCodeSchema = z.object({
  components: z.array(z.object({
    name: z.string(),
    code: z.string().describe('Complete TSX/JSX component code'),
    rationale: z.string().describe('Brief explanation of changes made'),
  })),
});

export type ComponentCode = z.infer<typeof ComponentCodeSchema>;
