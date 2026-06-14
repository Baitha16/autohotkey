import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabase.ts";
import { isValidMembershipType, isValidDuration, isValidPhone } from "../_shared/validation.ts";

function randomGroup(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { membership_type, duration_days, phone } = await req.json();

    if (!isValidMembershipType(membership_type)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid membership type" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    if (membership_type !== "lifetime" && !isValidDuration(duration_days)) {
      return new Response(
        JSON.stringify({ success: false, error: "Duration must be between 1 and 3650 days" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const useEZ = phone !== undefined && phone !== null && phone !== "";
    if (useEZ && !isValidPhone(phone)) {
      return new Response(
        JSON.stringify({ success: false, error: "Phone must be 9-15 digits" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    let license_code: string;

    if (useEZ) {
      license_code = `EZ-${phone}`;
      const expires_at = membership_type === "lifetime"
        ? new Date(Date.now() + 36500 * 86400000).toISOString()
        : new Date(Date.now() + duration_days * 86400000).toISOString();

      const { data: existing } = await supabase
        .from("licenses")
        .select("id")
        .eq("license_code", license_code)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("licenses")
          .update({ membership_type, expires_at })
          .eq("license_code", license_code);

        return new Response(
          JSON.stringify({ success: true, license_code, expires_at }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      } else {
        const { error } = await supabase.from("licenses").insert({
          license_code, membership_type, expires_at, status: "active",
        });
        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, license_code, expires_at }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } else {
      let attempts = 0;
      while (true) {
        const r1 = randomGroup();
        const r2 = randomGroup();
        const r3 = randomGroup();
        license_code = `VIP-${r1}-${r2}-${r3}`;

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
    }

    const expires_at = membership_type === "lifetime"
      ? new Date(Date.now() + 36500 * 86400000).toISOString()
      : new Date(Date.now() + duration_days * 86400000).toISOString();

    const { error } = await supabase.from("licenses").insert({
      license_code,
      membership_type,
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
