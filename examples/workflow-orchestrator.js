/**
 * AI-triggered workflow orchestration demo.
 *
 * The classifier is intentionally mocked. Production AI routing, proprietary
 * scoring, and enforcement internals are excluded from this public showcase.
 */

const WORKFLOWS = {
  onboarding: [validateInput, createExecutionPlan, writeAuditEvent],
  billing_review: [validateInput, checkBillingState, createExecutionPlan, writeAuditEvent],
  compliance_check: [validateInput, runComplianceSummary, writeAuditEvent],
};

export async function orchestrateWorkflow(input, context) {
  const intent = classifyIntent(input);
  const steps = WORKFLOWS[intent.workflow] || WORKFLOWS.onboarding;

  let state = {
    request_id: `req_${crypto.randomUUID()}`,
    workflow: intent.workflow,
    confidence: intent.confidence,
    input,
    events: [],
  };

  for (const step of steps) {
    state = await step(state, context);
  }

  return {
    ok: true,
    request_id: state.request_id,
    workflow: state.workflow,
    status: 'ready_for_execution',
    events: state.events,
  };
}

function classifyIntent(input) {
  const text = `${input.title || ''} ${input.message || ''}`.toLowerCase();
  if (text.includes('invoice') || text.includes('payment')) {
    return { workflow: 'billing_review', confidence: 0.86 };
  }
  if (text.includes('policy') || text.includes('risk')) {
    return { workflow: 'compliance_check', confidence: 0.82 };
  }
  return { workflow: 'onboarding', confidence: 0.74 };
}

async function validateInput(state) {
  if (!state.input || !state.input.email) {
    throw new Error('email_required');
  }
  return appendEvent(state, 'input_validated');
}

async function checkBillingState(state, context) {
  const billing = await context.billing.getStatus(state.input.email);
  return appendEvent({ ...state, billing }, 'billing_checked');
}

async function createExecutionPlan(state) {
  const plan = {
    modules: ['normalize', 'execute', 'notify'],
    priority: state.confidence > 0.8 ? 'high' : 'standard',
  };
  return appendEvent({ ...state, plan }, 'execution_plan_created');
}

async function runComplianceSummary(state) {
  const summary = {
    checks: ['data_minimization', 'retention', 'human_review'],
    result: 'review_recommended',
  };
  return appendEvent({ ...state, compliance: summary }, 'compliance_summary_created');
}

async function writeAuditEvent(state, context) {
  await context.audit.write({
    request_id: state.request_id,
    workflow: state.workflow,
    events: state.events,
    created_at: new Date().toISOString(),
  });
  return appendEvent(state, 'audit_written');
}

function appendEvent(state, event) {
  return {
    ...state,
    events: [...state.events, { event, ts: new Date().toISOString() }],
  };
}
