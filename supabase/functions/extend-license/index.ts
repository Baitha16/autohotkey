import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabase.ts";
import { isValidLicenseCode, isValidDuration } from "../_shared/validation.ts";

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { license_code, duration_days } = await req.json();

    if (!license_code || !isValidLicenseCode(license_code)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid license code format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    if (!isValidDuration(duration_days)) {
      return new Response(
        JSON.stringify({ success: false, error: "Duration must be between 1 and 3650 days" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const { data: existing, error: fetchError } = await supabase
      .from("licenses")
      .select("id, expires_at, status")
      .eq("license_code", license_code)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!existing) {
      return new Response(
        JSON.stringify({ success: false, error: "License code not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 },
      );
    }

    const currentExpiry = new Date(existing.expires_at);
    const now = new Date();
    const base = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(base.getTime() + duration_days * 86400000).toISOString();

    const { error: updateError } = await supabase
      .from("licenses")
      .update({ expires_at: newExpiry, last_used_at: now.toISOString(), status: "active" })
      .eq("license_code", license_code);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, license_code, expires_at: newExpiry }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Internal error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
