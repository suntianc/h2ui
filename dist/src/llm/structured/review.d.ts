import { z } from 'zod';
export declare const BoundaryChangeSchema: z.ZodObject<{
    component_id: z.ZodString;
    action: z.ZodEnum<["confirm", "reject", "modify"]>;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    component_id: string;
    action: "confirm" | "reject" | "modify";
    reason: string;
}, {
    component_id: string;
    action: "confirm" | "reject" | "modify";
    reason: string;
}>;
export declare const NamingSuggestionSchema: z.ZodObject<{
    original: z.ZodString;
    suggested: z.ZodString;
    rationale: z.ZodString;
}, "strip", z.ZodTypeAny, {
    original: string;
    suggested: string;
    rationale: string;
}, {
    original: string;
    suggested: string;
    rationale: string;
}>;
export declare const ComponentReviewSchema: z.ZodObject<{
    approved: z.ZodBoolean;
    boundary_changes: z.ZodArray<z.ZodObject<{
        component_id: z.ZodString;
        action: z.ZodEnum<["confirm", "reject", "modify"]>;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        component_id: string;
        action: "confirm" | "reject" | "modify";
        reason: string;
    }, {
        component_id: string;
        action: "confirm" | "reject" | "modify";
        reason: string;
    }>, "many">;
    naming_suggestions: z.ZodArray<z.ZodObject<{
        original: z.ZodString;
        suggested: z.ZodString;
        rationale: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        original: string;
        suggested: string;
        rationale: string;
    }, {
        original: string;
        suggested: string;
        rationale: string;
    }>, "many">;
    cleanup_hints: z.ZodArray<z.ZodString, "many">;
    _fallback: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    approved: boolean;
    boundary_changes: {
        component_id: string;
        action: "confirm" | "reject" | "modify";
        reason: string;
    }[];
    naming_suggestions: {
        original: string;
        suggested: string;
        rationale: string;
    }[];
    cleanup_hints: string[];
    _fallback?: boolean | null | undefined;
}, {
    approved: boolean;
    boundary_changes: {
        component_id: string;
        action: "confirm" | "reject" | "modify";
        reason: string;
    }[];
    naming_suggestions: {
        original: string;
        suggested: string;
        rationale: string;
    }[];
    cleanup_hints: string[];
    _fallback?: boolean | null | undefined;
}>;
export type ComponentReview = z.infer<typeof ComponentReviewSchema>;
export type BoundaryChange = z.infer<typeof BoundaryChangeSchema>;
export type NamingSuggestion = z.infer<typeof NamingSuggestionSchema>;
//# sourceMappingURL=review.d.ts.map