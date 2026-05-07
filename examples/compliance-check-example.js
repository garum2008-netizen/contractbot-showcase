/**
 * Simplified compliance validation pipeline.
 *
 * This is a showcase-safe example, not legal advice and not a production
 * policy engine.
 */

const CHECKS = [
  {
    id: 'data_minimization',
    label: 'Data minimization',
    test: (workflow) => workflow.fields.length <= 12,
  },
  {
    id: 'audit_trail',
    label: 'Audit trail',
    test: (workflow) => workflow.audit === true,
  },
  {
    id: 'human_review',
    label: 'Human review for high-risk flows',
    test: (workflow) => workflow.risk !== 'high' || workflow.requires_review === true,
  },
  {
    id: 'retention_policy',
    label: 'Retention policy',
    test: (workflow) => Number.isInteger(workflow.retention_days) && workflow.retention_days <= 365,
  },
];

export function runComplianceCheck(workflow) {
  const results = CHECKS.map((check) => ({
    id: check.id,
    label: check.label,
    passed: Boolean(check.test(workflow)),
  }));

  const failed = results.filter((result) => !result.passed);

  return {
    ok: failed.length === 0,
    score: Math.round(((results.length - failed.length) / results.length) * 100),
    failed_checks: failed.map((item) => item.id),
    results,
  };
}

export function exampleWorkflow() {
  return {
    name: 'Client onboarding automation',
    fields: ['name', 'email', 'company', 'country', 'message'],
    audit: true,
    risk: 'medium',
    requires_review: false,
    retention_days: 180,
  };
}
