# Security

This showcase repository is intentionally sanitized.

## Excluded

- Production secrets
- Real API keys
- Internal admin logic
- Proprietary enforcement internals
- Private webhook URLs
- Operational KV schemas
- Production `wrangler` configuration
- Customer data

## Included

- Placeholder environment variables
- Simplified API examples
- Mock workflow logic
- Public architecture diagrams
- Security-oriented implementation notes

## Secret Handling

Use `.env.example` as a template only. Store real values in your deployment platform's secret manager.

## Environment Separation Strategy

- Development uses local placeholders and mock service IDs.
- Staging uses scoped credentials isolated from production.
- Production secrets are managed outside this repository.
- Public examples never include real webhook URLs, admin routes, provider identifiers, or operational namespace identifiers.

## Public / Private Infrastructure Split

Public showcase:

- Architecture diagrams
- Sanitized Worker examples
- Mock billing flow
- Simplified workflow orchestration
- Documentation of engineering patterns

Private production systems:

- Enforcement logic
- Admin operations
- Real billing configuration
- Production infrastructure topology
- Customer data and operational telemetry

## Operational Hardening Philosophy

Recommended production controls:

- Cloudflare Access for admin surfaces
- Scoped Cloudflare API tokens
- Stripe webhook signature verification
- Least-privilege KV/R2/D1 access
- Structured audit logs without raw secrets
- Separate staging and production credentials
- Fail-closed internal APIs
- Idempotent webhook processing
- Public-safe status endpoints

## Public Review Safety

The examples are designed to demonstrate engineering patterns without exposing operational attack surface.
