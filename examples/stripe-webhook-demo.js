/**
 * Sanitized Stripe webhook demo for Cloudflare Workers.
 *
 * Uses Web Crypto signature verification. This is a showcase example and
 * excludes production retries, entitlement policy, and private event mapping.
 */

export async function handleStripeWebhook(request, env) {
  const signature = request.headers.get('stripe-signature') || '';
  const rawBody = await request.text();

  const verified = await verifyStripeSignature({
    payload: rawBody,
    signatureHeader: signature,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  });

  if (!verified.ok) {
    return json({ ok: false, error: 'invalid_signature' }, 400);
  }

  const event = JSON.parse(rawBody);
  const result = await routeBillingEvent(event, env);

  return json({ ok: true, handled: result.handled, event_type: event.type });
}

async function routeBillingEvent(event, env) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data && event.data.object ? event.data.object : {};
    const workflowId = String(session.metadata?.workflow_id || '').trim();

    if (workflowId) {
      await env.SHOWCASE_KV.put(
        `billing:${workflowId}`,
        JSON.stringify({
          workflow_id: workflowId,
          status: 'paid',
          updated_at: new Date().toISOString(),
        }),
        { expirationTtl: 60 * 60 * 24 }
      );
    }

    return { handled: true };
  }

  return { handled: false };
}

async function verifyStripeSignature({ payload, signatureHeader, webhookSecret }) {
  if (!webhookSecret || !signatureHeader) return { ok: false };

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.split('=');
      return [key, value];
    })
  );

  const timestamp = parts.t;
  const expected = parts.v1;
  if (!timestamp || !expected) return { ok: false };

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const actual = [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

  return { ok: timingSafeEqual(actual, expected) };
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
