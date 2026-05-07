# API Overview

The showcase API is modeled as a small Cloudflare Worker surface.

## Public Routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Public health check |
| `POST` | `/workflow` | Submit a workflow request |
| `GET` | `/workflow/:id` | Read sanitized workflow status |

## Webhook Routes

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/webhooks/stripe` | Receive signed Stripe events |

## Response Shape

```json
{
  "ok": true,
  "request_id": "req_showcase_123",
  "status": "queued"
}
```

## Security Notes

- Admin-only routes are omitted from this public showcase.
- Production systems should enforce authentication, rate limits, replay protection, and structured logging.
- Do not expose raw provider payloads in public responses.
