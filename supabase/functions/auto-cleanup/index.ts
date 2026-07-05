import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabase.ts";

function randomGroup(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { data: settings } = await supabase
      .from("app_settings")
      .select("setting_name, setting_value")
      .in("setting_name", ["auto_cleanup_interval_days", "auto_cleanup_last_run"]);

    let intervalDays = 3;
    let lastRun: string | null = null;

    if (settings) {
      for (const item of settings) {
        if (item.setting_name === "auto_cleanup_interval_days") {
          intervalDays = parseInt(item.setting_value) || 3;
        }
        if (item.setting_name === "auto_cleanup_last_run") {
          lastRun = item.setting_value;
        }
      }
    }

    if (lastRun) {
      const elapsed = Date.now() - new Date(lastRun).getTime();
      if (elapsed < intervalDays * 86400000) {
        return new Response(
          JSON.stringify({ success: true, skipped: true, message: "Skipping, not yet due" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const { data: deleted, error: delError } = await supabase
      .from("licenses")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select("id");

    if (delError) throw delError;
    const deletedCount = deleted?.length ?? 0;

    let license_code: string;
    let attempts = 0;
    while (true) {
      license_code = `TRIAL-${randomGroup()}-${randomGroup()}-${randomGroup()}`;
      const { data: existing } = await supabase
        .from("licenses")
        .select("id")
        .eq("license_code", license_code)
        .maybeSingle();
      if (!existing) break;
      attempts++;
      if (attempts > 10) {
        return new Response(
          JSON.stringify({ success: false, error: "Could not generate unique code" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
        );
      }
    }

    const expires_at = new Date(
      Date.now() + intervalDays * 86400000
    ).toISOString();

    const { error: insError } = await supabase.from("licenses").insert({
      license_code,
      membership_type: "trial",
      expires_at,
      status: "active",
    });

    if (insError) throw insError;

    const now = new Date().toISOString();

    const { data: existingSetting } = await supabase
      .from("app_settings")
      .select("setting_name")
      .eq("setting_name", "auto_cleanup_last_run")
      .maybeSingle();

    if (existingSetting) {
      await supabase
        .from("app_settings")
        .update({ setting_value: now })
        .eq("setting_name", "auto_cleanup_last_run");
    } else {
      await supabase
        .from("app_settings")
        .insert({ setting_name: "auto_cleanup_last_run", setting_value: now });
    }

    return new Response(
      JSON.stringify({
        success: true,
        skipped: false,
        deleted_count: deletedCount,
        generated_code: license_code,
        expires_at,
        interval_days: intervalDays,
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
