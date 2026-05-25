import { describe, it, expect } from 'vitest';

// TODO: Import CLI integration once implemented in plan 04
// import { convertCommand } from '../../../src/cli/commands/convert';

describe('AGENT-01: --agent flag support exists in CLI', () => {
  it.todo('--agent flag triggers agent mode');
  it.todo('Agent mode calls agent.run() instead of pipeline.run()');
  it.todo('Agent mode passes inputPath and outputPath to agent');
  it.todo('Agent mode passes options including maxRepairAttempts');
});

describe('CLI Integration', () => {
  it.todo('convertCommand with --agent flag enters agent mode');
  it.todo('convertCommand without --agent flag uses normal pipeline');
  it.todo('Agent result includes outputPath, confidence, repairAttempts, plan, tokenCount');
});
