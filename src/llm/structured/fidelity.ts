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

export const FidelityResultSchema = z.object({
  // Review fields
  approved: z.boolean(),
  boundary_changes: z.array(BoundaryChangeSchema),
  naming_suggestions: z.array(NamingSuggestionSchema),
  cleanup_hints: z.array(z.string().max(150)),

  // Modify fields
  components: z.array(z.object({
    name: z.string(),
    code: z.string(),
    rationale: z.string(),
  })),

  // Fidelity fields (NEW)
  fidelity_report: z.object({
    structure_match: z.boolean(),
    attribute_preservation: z.array(z.object({
      component: z.string(),
      missing_attributes: z.array(z.string()),
    })),
    text_content_match: z.boolean(),
    css_preservation: z.boolean(),
    fidelity_notes: z.array(z.string().max(200)),
  }).optional(),  // Optional for graceful degradation - LLM may fail with partial result

  _fallback: z.boolean().nullable().optional(),
});

export type FidelityResult = z.infer<typeof FidelityResultSchema>;
