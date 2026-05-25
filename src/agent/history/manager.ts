/**
 * History Manager for the autonomous agent.
 *
 * Persists failed strategies to .h2ui/agent-history.json.
 *
 * @module agent/history/manager
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const HISTORY_DIR = '.h2ui';
const HISTORY_FILE = 'agent-history.json';

/**
 * Agent history record.
 */
export interface AgentHistory {
  threadId: string;
  failedStrategies: string[];
  tokenCount: number;
  lastUpdated: string;
}

/**
 * Ensure the .h2ui directory exists.
 */
async function ensureHistoryDir(): Promise<void> {
  await fs.mkdir(HISTORY_DIR, { recursive: true });
}

/**
 * Read the full history file.
 */
function readHistoryFile(): Promise<Record<string, AgentHistory> | null> {
  return fs.readFile(path.join(HISTORY_DIR, HISTORY_FILE), 'utf-8')
    .then(content => {
      try {
        const parsed = JSON.parse(content);
        if (typeof parsed !== 'object' || parsed === null) {
          return null;
        }
        return parsed as Record<string, AgentHistory>;
      } catch {
        return null;
      }
    })
    .catch(() => null);
}

/**
 * Write the full history file.
 */
async function writeHistoryFile(data: Record<string, AgentHistory>): Promise<void> {
  await ensureHistoryDir();
  await fs.writeFile(
    path.join(HISTORY_DIR, HISTORY_FILE),
    JSON.stringify(data, null, 2),
    'utf-8'
  );
}

/**
 * Read history for a specific thread.
 *
 * @param threadId - Thread ID to look up
 * @returns AgentHistory or null if not found
 */
export function readHistory(threadId: string): AgentHistory | null {
  return null; // Synchronous stub - actual implementation uses async readHistoryAsync
}

/**
 * Async version of readHistory.
 */
export async function readHistoryAsync(threadId: string): Promise<AgentHistory | null> {
  const history = await readHistoryFile();
  if (!history) return null;
  return history[threadId] ?? null;
}

/**
 * Write history for a specific thread.
 *
 * @param historyData - History data to write
 */
export async function writeHistory(historyData: AgentHistory): Promise<void> {
  const history = (await readHistoryFile()) ?? {};
  history[historyData.threadId] = historyData;
  await writeHistoryFile(history);
}

/**
 * Add a failed strategy to the history.
 *
 * @param threadId - Thread ID
 * @param strategy - Strategy ID that failed
 */
export async function addFailedStrategy(threadId: string, strategy: string): Promise<void> {
  const existing = await readHistoryAsync(threadId);
  const strategies = existing?.failedStrategies ?? [];

  if (!strategies.includes(strategy)) {
    await writeHistory({
      threadId,
      failedStrategies: [...strategies, strategy],
      tokenCount: existing?.tokenCount ?? 0,
      lastUpdated: new Date().toISOString(),
    });
  }
}

/**
 * Get failed strategies for a thread.
 *
 * @param threadId - Thread ID
 * @returns Array of failed strategy IDs
 */
export function getFailedStrategies(threadId: string): string[] {
  return []; // Synchronous stub - actual implementation uses async version
}

/**
 * Async version of getFailedStrategies.
 */
export async function getFailedStrategiesAsync(threadId: string): Promise<string[]> {
  const history = await readHistoryAsync(threadId);
  return history?.failedStrategies ?? [];
}
