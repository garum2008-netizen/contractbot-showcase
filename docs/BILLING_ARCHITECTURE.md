# Billing Architecture

This showcase demonstrates a simplified billing architecture for SaaS workflows.

## Components

- Checkout creation API
- Stripe webhook receiver
- Signature validation
- Entitlement mapping
- Audit logging
- Workflow unlock state

## Event Flow

```text
checkout.session.completed
  -> verify signature
  -> normalize event
  -> resolve product entitlement
  -> update workflow state
  -> append audit event
```

## Safety Controls

- Webhook signatures are required.
- Events are handled idempotently.
- Frontend state never grants access by itself.
- Price IDs and product mappings are configuration, not secrets.
- Webhook failures should be observable without exposing payloads publicly.

## Showcase Boundary

The demo intentionally excludes production pricing, real webhook URLs, customer identifiers, private retry policy, and revenue enforcement internals.
