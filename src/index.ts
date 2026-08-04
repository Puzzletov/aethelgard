export interface Env {
  // Bind secrets/vars here as they're added, e.g.:
  // GROQ_API_KEY: string;
  // OPENROUTER_API_KEY: string;
  // RESEND_API_KEY: string;
  // SENTRY_DSN: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return new Response(
      JSON.stringify({ status: "ok", service: "aethelgard" }),
      { headers: { "content-type": "application/json" } }
    );
  },
};
