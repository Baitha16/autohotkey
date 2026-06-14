import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabase.ts";
import { isValidLicenseCode } from "../_shared/validation.ts";

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { license_code } = await req.json();

    if (!license_code || !isValidLicenseCode(license_code)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid license code format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("licenses")
      .select("license_code, membership_type, expires_at, status")
      .eq("license_code", license_code)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: "License code not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 },
      );
    }

    if (data.status !== "active") {
      return new Response(
        JSON.stringify({ success: false, error: `License is ${data.status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 },
      );
    }

    const now = new Date();
    const expires = new Date(data.expires_at);

    if (now > expires) {
      await supabase
        .from("licenses")
        .update({ status: "expired" })
        .eq("license_code", license_code);

      return new Response(
        JSON.stringify({ success: false, error: "License has expired" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 },
      );
    }

    await supabase
      .from("licenses")
      .update({ last_used_at: now.toISOString() })
      .eq("license_code", license_code);

    return new Response(
      JSON.stringify({
        success: true,
        membership_type: data.membership_type,
        expires_at: data.expires_at,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Internal error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
