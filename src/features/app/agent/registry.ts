import type { AgentTool, AgentToolParam } from './types'

/**
 * The tool registry — every module capability an agent may run, described
 * once. Tools register at module load (`defineTool` at the top of the
 * module's `agentTools.ts`); proposals refer to them by dotted id.
 *
 * The registry is the single source for `describeToolsForModel()` — the
 * provider-neutral schema block a future Advisor engine response or local
 * model consumes to decide *what* to propose. Nothing in the descriptor is
 * model-specific: OpenAI-style function calling, a constrained local model,
 * or a deterministic parser all read the same shape.
 */

const tools = new Map<string, AgentTool>()

/** Register a tool. Duplicate ids throw — a name collision is a defect. */
export function defineTool<ModuleContext>(tool: AgentTool<ModuleContext>): void {
  if (tools.has(tool.id)) {
    throw new Error(`agent tool already registered: ${tool.id}`)
  }
  tools.set(tool.id, tool as AgentTool)
}

export function getTool(id: string): AgentTool | undefined {
  return tools.get(id)
}

export function listTools(): readonly AgentTool[] {
  return [...tools.values()]
}

/** Test hook — tests must not leak registrations into the app registry. */
export function resetToolsForTest(): void {
  tools.clear()
}

/* ── Provider-neutral model descriptors ──────────────────────────────────── */

export interface ModelToolParamDescriptor {
  readonly type: 'string' | 'number' | 'boolean'
  readonly description: string
  readonly enum?: readonly string[]
}

export interface ModelToolDescriptor {
  readonly name: string
  readonly description: string
  readonly module: string
  readonly riskTier: AgentTool['tier']
  readonly parameters: {
    readonly type: 'object'
    readonly properties: Record<string, ModelToolParamDescriptor>
    readonly required: readonly string[]
  }
}

function paramDescriptor(param: AgentToolParam): ModelToolParamDescriptor {
  return {
    type: param.type === 'enum' ? 'string' : param.type === 'date' ? 'string' : param.type,
    description: param.description.en,
    ...(param.enum ? { enum: param.enum } : {}),
  }
}

/**
 * The schema block a proposing model reads — EN descriptions (models work
 * in EN; the card localizes for the user). A local model consumes the same
 * descriptors; nothing here assumes a vendor's function-calling format.
 */
export function describeToolsForModel(): readonly ModelToolDescriptor[] {
  return listTools().map((tool) => ({
    name: tool.id,
    description: tool.description.en,
    module: tool.module,
    riskTier: tool.tier,
    parameters: {
      type: 'object',
      properties: Object.fromEntries(
        tool.params.map((param) => [param.name, paramDescriptor(param)]),
      ),
      required: tool.params.filter((p) => p.required).map((p) => p.name),
    },
  }))
}
