export default {
  fetch(): Response {
    return new Response(
      JSON.stringify({ status: "ok", service: "aethelgard" }),
      { headers: { "content-type": "application/json" } }
    );
  },
};
