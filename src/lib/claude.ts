// Claude AI Client for GuestFlow PMS
// Anthropic Claude API integration with smart provider routing

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';

/**
 * Resolves Google Gemini API key from process.env or database SystemSetting
 */
export async function getGeminiApiKey(): Promise<string | null> {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'GEMINI_API_KEY' },
    });
    if (setting?.value?.trim()) return setting.value.trim();
    const ws = await prisma.websiteSettings.findFirst();
    if (ws?.geminiApiKey?.trim()) return ws.geminiApiKey.trim();
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolves Anthropic API key from process.env or database SystemSetting
 */
export async function getAnthropicApiKey(): Promise<string | null> {
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'ANTHROPIC_API_KEY' },
    });
    return setting?.value?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Gets initialized Anthropic client using dynamic or env API key
 */
export async function getAnthropicClient(): Promise<Anthropic> {
  const apiKey = await getAnthropicApiKey();
  if (!apiKey) {
    throw new Error('Claude API Key not configured. Please add it in Super Admin Settings > Notifications or set ANTHROPIC_API_KEY in .env');
  }
  return new Anthropic({ apiKey });
}

// Fallback static instance if env is present
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy_key',
});

// Task types for smart routing
export type AITask =
  | 'reasoning'   // → Claude (complex decisions, multi-step thinking)
  | 'error-check' // → Claude (code/data analysis, bug detection)
  | 'chat'        // → Claude (concierge, guest conversations)
  | 'analytics'   // → Claude (business intelligence, anomaly detection)
  | 'audit'       // → Claude (compliance, financial checks)
  | 'content'     // → Gemini (blog, SEO, descriptions)
  | 'ocr'         // → Gemini (menu photo scanning, image recognition)
  | 'translation'; // → Gemini (fast language tasks)

/**
 * Returns which AI provider to use for a given task.
 * Env var AI_PROVIDER can override: 'claude' | 'gemini' | 'auto'
 */
export function getAIProvider(task: AITask): 'claude' | 'gemini' {
  const override = process.env.AI_PROVIDER as string | undefined;
  if (override === 'claude') return 'claude';
  if (override === 'gemini') return 'gemini';

  // Auto mode: Claude for reasoning, Gemini for content/vision
  const claudeTasks: AITask[] = ['reasoning', 'error-check', 'chat', 'analytics', 'audit'];
  return claudeTasks.includes(task) ? 'claude' : 'gemini';
}

/**
 * Send a message to Claude and get a text response.
 * @param prompt - The user/system prompt
 * @param systemPrompt - Optional system context
 * @param model - Claude model to use (default: claude-haiku-5-5 for fast/budget, claude-sonnet-5-5 for reasoning)
 * @param maxTokens - Max response tokens (default: 2048)
 */
export async function askClaude(
  prompt: string,
  systemPrompt?: string,
  model: string = 'claude-haiku-5-5',
  maxTokens: number = 2048,
): Promise<string> {
  const client = await getAnthropicClient();
  const params: Anthropic.MessageCreateParamsNonStreaming = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  };

  if (systemPrompt) {
    params.system = systemPrompt;
  }

  // Model fallback chain: claude-haiku-5-5 -> claude-sonnet-5-5 -> claude-3-5-sonnet-latest
  try {
    const message = await client.messages.create(params);
    const block = message.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
    return block.text;
  } catch (err: any) {
    if (err?.status === 404 || err?.message?.includes('not_found_error')) {
      // Fallback to sonnet-5-5 or 3-5-sonnet
      const fallbackModel = model === 'claude-haiku-5-5' ? 'claude-sonnet-5-5' : 'claude-3-5-sonnet-latest';
      const fallbackMessage = await client.messages.create({ ...params, model: fallbackModel });
      const block = fallbackMessage.content[0];
      if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
      return block.text;
    }
    throw err;
  }
}

/**
 * Ask Claude and parse the response as JSON.
 * Claude is prompted to return valid JSON only.
 */
export async function askClaudeJSON<T = unknown>(
  prompt: string,
  systemPrompt?: string,
  model: string = 'claude-haiku-5-5',
): Promise<T> {
  const jsonSystemPrompt = [
    systemPrompt,
    'IMPORTANT: Respond ONLY with valid JSON. No markdown, no explanations, no code blocks. Just raw JSON.',
  ]
    .filter(Boolean)
    .join('\n');

  const raw = await askClaude(prompt, jsonSystemPrompt, model);
  const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned) as T;
}

/**
 * Error / Bug check using Claude.
 * Pass any data object and Claude will analyze it for issues.
 */
export interface AIIssue {
  severity: 'critical' | 'warning' | 'info';
  type: string;
  description: string;
  affectedRecord?: string;
  suggestedFix?: string;
}

export interface AIAuditResult {
  issues: AIIssue[];
  summary: string;
  totalIssues: number;
  isHealthy: boolean;
}

export async function runErrorCheck(
  checkName: string,
  data: unknown,
  context?: string,
): Promise<AIAuditResult> {
  const prompt = `
You are a hotel PMS cybersecurity and system audit AI for GuestFlow. 
Analyze the following security alerts and runtime data to detect patterns, critical bugs, vulnerabilities, or attacks.

Check Name: ${checkName}
${context ? `Context: ${context}` : ''}

Data to analyze:
${JSON.stringify(data, null, 2)}

Return a JSON object with this exact structure:
{
  "issues": [
    {
      "severity": "critical|warning|info",
      "type": "short type name",
      "description": "clear description of the issue",
      "affectedRecord": "ID or name of the affected item (if any)",
      "suggestedFix": "what should be done to fix this"
    }
  ],
  "summary": "concise overall summary of the system audit",
  "totalIssues": <number of issues found>,
  "isHealthy": <true if no critical issues found, else false>
}
`;

  // 1. Try Claude first
  try {
    return await askClaudeJSON<AIAuditResult>(
      prompt,
      'You are a strict cybersecurity and audit AI for a hotel management system. Be thorough, accurate, and output only valid JSON.',
      'claude-3-5-sonnet-latest',
    );
  } catch (claudeErr: any) {
    console.warn('[AI Audit] Claude failed or insufficient credits, attempting fallback...', claudeErr?.message);

    // 2. Fallback to Gemini if configured
    const geminiKey = await getGeminiApiKey();
    if (geminiKey) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(`${prompt}\nIMPORTANT: Respond with pure JSON only, no markdown markers.`);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text) as AIAuditResult;
      } catch (geminiErr: any) {
        console.warn('[AI Audit] Gemini fallback also failed:', geminiErr?.message);
      }
    }

    // 3. Fallback: Local rule-based AI heuristic engine (Never crashes!)
    return generateLocalRuleBasedAudit(data, claudeErr?.message);
  }
}

/**
 * Local heuristic audit fallback when API credits are exhausted
 */
function generateLocalRuleBasedAudit(data: any, originalError?: string): AIAuditResult {
  const alerts = Array.isArray(data) ? data : [];
  const issues: AIIssue[] = [];

  const criticals = alerts.filter((a: any) => a.severity === 'critical' || a.type === 'SQL_INJECTION');
  const bruteforce = alerts.filter((a: any) => a.type === 'BRUTE_FORCE');
  const dataIssues = alerts.filter((a: any) => a.type === 'DATA_INCONSISTENCY');

  if (criticals.length > 0) {
    issues.push({
      severity: 'critical',
      type: 'SQL_INJECTION / CRITICAL_THREAT',
      description: `${criticals.length} critical vulnerability/injection attempt(s) detected in system requests.`,
      suggestedFix: 'Enable automated IP blocking and verify parameterized queries for payment & order routes.',
    });
  }

  if (bruteforce.length > 0) {
    issues.push({
      severity: 'warning',
      type: 'BRUTE_FORCE_LOGIN',
      description: `Repeated failed logins detected (${bruteforce.length} events). Possible credential stuffing attack.`,
      suggestedFix: 'Enforce rate-limiting and verify CAPTCHA on the login endpoint.',
    });
  }

  if (dataIssues.length > 0) {
    issues.push({
      severity: 'warning',
      type: 'DATA_INTEGRITY_MISMATCH',
      description: `${dataIssues.length} room/order records have conflicting or desynchronized statuses.`,
      suggestedFix: 'Run the AI Auto-Healer to synchronize room cleanliness with occupancy states.',
    });
  }

  const creditWarning = originalError?.includes('credit balance') || originalError?.includes('400')
    ? ' (Notice: Claude API balance low - processed via Local Heuristic AI Engine)'
    : '';

  return {
    issues,
    summary: issues.length === 0
      ? `System audit completed. No active anomalies or attack vectors found.${creditWarning}`
      : `Audit found ${issues.length} threat pattern(s) requiring attention.${creditWarning}`,
    totalIssues: issues.length,
    isHealthy: criticals.length === 0,
  };
}

/**
 * Quick health check — returns true if Claude API is reachable and responding.
 */
export async function checkClaudeHealth(): Promise<{ ok: boolean; model: string; error?: string }> {
  try {
    const text = await askClaude('Reply with exactly: {"status":"ok"}', undefined, 'claude-haiku-5-5', 50);
    const parsed = JSON.parse(text.trim());
    return { ok: parsed.status === 'ok', model: 'claude-haiku-5-5' };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { ok: false, model: 'claude-haiku-5-5', error: errorMessage };
  }
}

