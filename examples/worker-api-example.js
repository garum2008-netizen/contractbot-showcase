/**
 * Cloudflare Worker API example.
 *
 * Showcase-safe:
 * - no production routes
 * - no real namespace names
 * - no admin logic
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return json({ ok: true, service: 'contractbot-showcase-api' });
    }

    if (url.pathname === '/workflow' && request.method === 'POST') {
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== 'object') {
        return json({ ok: false, error: 'invalid_json' }, 400);
      }

      const workflowId = `wf_${crypto.randomUUID()}`;
      const record = {
        id: workflowId,
        status: 'queued',
        type: String(body.type || 'general_workflow').slice(0, 80),
        created_at: new Date().toISOString(),
      };

      await env.SHOWCASE_KV.put(`workflow:${workflowId}`, JSON.stringify(record), {
        expirationTtl: 60 * 60,
      });

      return json({ ok: true, workflow: record }, 202);
    }

    if (url.pathname.startsWith('/workflow/') && request.method === 'GET') {
      const workflowId = url.pathname.split('/').pop();
      const record = await env.SHOWCASE_KV.get(`workflow:${workflowId}`, 'json');
      if (!record) return json({ ok: false, error: 'not_found' }, 404);
      return json({ ok: true, workflow: record });
    }

    return json({ ok: false, error: 'not_found' }, 404);
  },
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
