import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabase.ts";

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const rand = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `TRIAL-${rand()}-${rand()}-${rand()}`;
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    let license_code: string;
    let attempts = 0;

    while (true) {
      license_code = generateCode();
      const { data } = await supabase
        .from("licenses")
        .select("id")
        .eq("license_code", license_code)
        .maybeSingle();

      if (!data) break;
      attempts++;
      if (attempts > 10) {
        return new Response(
          JSON.stringify({ success: false, error: "Could not generate unique code" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
        );
      }
    }

    const expires_at = new Date(Date.now() + 3600000).toISOString();

    const { error } = await supabase.from("licenses").insert({
      license_code,
      membership_type: "trial",
      expires_at,
      status: "active",
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, license_code, expires_at }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Internal error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
