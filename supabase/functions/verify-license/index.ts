import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabase.ts";
import { isValidLicenseCode } from "../_shared/validation.ts";

function parseProgramTypes(pt: string | null): string[] {
  if (!pt) return [];
  if (pt.startsWith("[")) {
    try { return JSON.parse(pt); } catch { return pt ? [pt] : []; }
  }
  return pt ? [pt] : [];
}

function parseHwids(hwid: string | null): string[] {
  if (!hwid) return [];
  try {
    const parsed = JSON.parse(hwid);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [hwid];
  }
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { license_code, hwid, program_type } = await req.json();

    if (!license_code || !isValidLicenseCode(license_code)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid license code format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    if (!hwid) {
      return new Response(
        JSON.stringify({ success: false, error: "HWID is required for verification" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("licenses")
      .select("license_code, membership_type, expires_at, status, program_type, hwid, hwid_slots")
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

    // PROGRAM TYPE BINDING — support multiple program types
    if (data.program_type) {
      const pts = parseProgramTypes(data.program_type);
      if (pts.length > 0 && (!program_type || !pts.includes(program_type))) {
        return new Response(
          JSON.stringify({ success: false, error: "License is bound to a different program" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 },
        );
      }
    }

    // HWID binding logic
    const maxSlots = data.hwid_slots || 1;
    let hwids = parseHwids(data.hwid);

    if (hwids.length === 0) {
      hwids = [hwid];
    } else if (!hwids.includes(hwid)) {
      if (hwids.length >= maxSlots) {
        return new Response(
          JSON.stringify({ success: false, error: "License is already in use on another device" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 },
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: "License is currently active on another device" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 },
      );
    }

    const updateFields: Record<string, unknown> = { hwid: JSON.stringify(hwids) };
    if (!data.program_type && program_type) {
      updateFields.program_type = JSON.stringify([program_type]);
    }
    await supabase
      .from("licenses")
      .update(updateFields)
      .eq("license_code", license_code);

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
        program_type: data.program_type,
        hwid_slots: maxSlots,
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
