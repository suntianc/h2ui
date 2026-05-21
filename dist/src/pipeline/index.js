export class Pipeline {
    steps = [];
    addStep(step) {
        this.steps.push(step);
    }
    insertStep(index, step) {
        this.steps.splice(index, 0, step);
    }
    removeStep(name) {
        this.steps = this.steps.filter(s => s.name !== name);
    }
    async run(initialCtx) {
        let ctx = initialCtx;
        for (const step of this.steps) {
            try {
                ctx = await step.run(ctx);
            }
            catch (err) {
                ctx = {
                    ...ctx,
                    errors: [...ctx.errors, `[${step.name}] ${err.message}`],
                };
                if (ctx.options.strict)
                    break;
            }
        }
        return ctx;
    }
}
//# sourceMappingURL=index.js.map