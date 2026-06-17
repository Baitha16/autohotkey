import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabase.ts";
import { isValidLicenseCode } from "../_shared/validation.ts";

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { license_code, program_type, owner } = await req.json();

    if (!license_code || !isValidLicenseCode(license_code)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid license code format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const { data: existing, error: fetchError } = await supabase
      .from("licenses")
      .select("id")
      .eq("license_code", license_code)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!existing) {
      return new Response(
        JSON.stringify({ success: false, error: "License code not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (program_type !== undefined) updateData.program_type = program_type;
    if (owner !== undefined) updateData.owner = owner;

    const { error: updateError } = await supabase
      .from("licenses")
      .update(updateData)
      .eq("license_code", license_code);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, message: "License updated" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Internal error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
