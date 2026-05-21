import { z } from 'zod';

export const BoundaryChangeSchema = z.object({
  component_id: z.string(),
  action: z.enum(['confirm', 'reject', 'modify']),
  reason: z.string().max(200),
});

export const NamingSuggestionSchema = z.object({
  original: z.string(),
  suggested: z.string(),
  rationale: z.string().max(100),
});

export const ComponentReviewSchema = z.object({
  approved: z.boolean(),
  boundary_changes: z.array(BoundaryChangeSchema),
  naming_suggestions: z.array(NamingSuggestionSchema),
  cleanup_hints: z.array(z.string().max(150)),
});

export type ComponentReview = z.infer<typeof ComponentReviewSchema>;
export type BoundaryChange = z.infer<typeof BoundaryChangeSchema>;
export type NamingSuggestion = z.infer<typeof NamingSuggestionSchema>;
