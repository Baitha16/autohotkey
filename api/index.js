import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cron from "node-cron";
import { getSupabase } from "../src/db/supabase.js";
import {
  isValidLicenseCode,
  isValidPhone,
  isValidMembershipType,
  isValidDuration,
} from "../src/validators/license.js";

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(cors());
app.use(express.json({ limit: "16kb" }));

/* ---------- helpers ---------- */

function randomGroup() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, ...data });
}

function fail(res, error, status = 400) {
  return res.status(status).json({ success: false, error });
}

/* ---------- auth middleware ---------- */

function adminAuth(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || key !== process.env.ADMIN_KEY) {
    return fail(res, "Unauthorized", 401);
  }
  next();
}

/* ---------- rate limiters ---------- */

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, error: "Too many requests" },
});

const trialLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, error: "Too many trial requests" },
});

/* ---------- PUBLIC: verify-license (UPDATED DENGAN HWID) ---------- */

app.post("/api/verify-license", async (req, res) => {
  try {
    const { license_code, hwid } = req.body;

    if (!license_code || !isValidLicenseCode(license_code)) {
      return fail(res, "Invalid license code format");
    }

    if (!hwid) {
      return fail(res, "HWID is required for verification");
    }

    // Mengambil data lisensi termasuk kolom hwid
    const { data, error } = await getSupabase()
      .from("licenses")
      .select("license_code, membership_type, expires_at, status, owner, program_type, hwid")
      .eq("license_code", license_code)
      .maybeSingle();

    if (error) throw error;
    if (!data) return fail(res, "License code not found", 404);
    if (data.status !== "active") {
      return fail(res, `License is ${data.status}`, 403);
    }

    // LOGIKA PENGIKATAN HWID
    let boundHwid = data.hwid;
    if (!boundHwid) {
      // Jika HWID masih kosong, ikat HWID pertama kali perangkat login
      await getSupabase()
        .from("licenses")
        .update({ hwid: hwid })
        .eq("license_code", license_code);
      boundHwid = hwid;
    } else if (boundHwid !== hwid) {
      // Jika HWID berbeda dengan yang tersimpan, tolak akses!
      return fail(res, "License is already bound to another device", 403);
    }

    const now = new Date();
    const expires = new Date(data.expires_at);

    if (now > expires) {
      await getSupabase()
        .from("licenses")
        .update({ status: "expired" })
        .eq("license_code", license_code);
      return fail(res, "License has expired", 403);
    }

    await getSupabase()
      .from("licenses")
      .update({ last_used_at: now.toISOString() })
      .eq("license_code", license_code);

    return ok(res, {
      membership_type: data.membership_type,
      expires_at: data.expires_at,
      owner: data.owner,
      program_type: data.program_type,
      hwid: boundHwid
    });
  } catch (err) {
    return fail(res, err.message || "Internal error", 500);
  }
});

/* ---------- PUBLIC: generate-trial ---------- */

app.post("/api/generate-trial", trialLimiter, async (req, res) => {
  try {
    let license_code;
    let attempts = 0;

    while (true) {
      license_code = `TRIAL-${randomGroup()}-${randomGroup()}-${randomGroup()}`;
      const { data } = await getSupabase()
        .from("licenses")
        .select("id")
        .eq("license_code", license_code)
        .maybeSingle();

      if (!data) break;
      if (++attempts > 10) {
        return fail(res, "Could not generate unique code", 500);
      }
    }

    const trialMinutes = Math.max(1, Math.min(43200, parseInt(req.body.trial_minutes) || 60));
    const expires_at = new Date(Date.now() + trialMinutes * 60000).toISOString();
    const trialData = {
      license_code,
      membership_type: "trial",
      expires_at,
      status: "active",
      hwid: null // Trial awal belum terikat HWID
    };
    const { owner: trialOwner, program_type: trialProgram } = req.body;
    if (trialOwner != null) trialData.owner = trialOwner;
    if (trialProgram != null) trialData.program_type = trialProgram;
    const { error } = await getSupabase().from("licenses").insert(trialData);

    if (error) throw error;

    return ok(res, { license_code, expires_at });
  } catch (err) {
    return fail(res, err.message || "Internal error", 500);
  }
});

/* ---------- ADMIN: list-licenses ---------- */

app.get("/api/licenses", adminAuth, adminLimiter, async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from("licenses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return ok(res, { data });
  } catch (err) {
    return fail(res, err.message || "Internal error", 500);
  }
});

/* ---------- ADMIN: generate-code ---------- */

app.post("/api/generate-code", adminAuth, adminLimiter, async (req, res) => {
  try {
    const { membership_type, duration_days, phone, program_type } = req.body;
    const { owner } = req.body;

    if (!isValidMembershipType(membership_type)) {
      return fail(res, "Invalid membership type");
    }

    if (membership_type !== "lifetime" && !isValidDuration(duration_days)) {
      return fail(res, "Duration must be between 1 and 3650 days");
    }

    const prefix =
      membership_type === "weekly" ? "WL" :
      membership_type === "monthly" ? "ML" :
      "LT";

    const phoneStr = phone != null ? String(phone).trim() : "";
    const useEZ = phoneStr !== "";
    if (useEZ && !isValidPhone(phoneStr)) {
      return fail(res, "Phone must be 9-15 digits");
    }

    let license_code;

    if (useEZ) {
      license_code = `${prefix}-${phoneStr}`;
      const newExpiry =
        membership_type === "lifetime"
          ? new Date(Date.now() + 36500 * 86400000).toISOString()
          : new Date(Date.now() + duration_days * 86400000).toISOString();

      const { data: existing } = await getSupabase()
        .from("licenses")
        .select("id, expires_at")
        .eq("license_code", license_code)
        .maybeSingle();

      if (existing) {
        const finalExpiry =
          new Date(newExpiry) > new Date(existing.expires_at)
            ? newExpiry
            : existing.expires_at;

        const updateData = { membership_type, expires_at: finalExpiry };
        if (owner != null) updateData.owner = owner;
        if (program_type != null) updateData.program_type = program_type;
        await getSupabase()
          .from("licenses")
          .update(updateData)
          .eq("license_code", license_code);

        return ok(res, { license_code, expires_at: finalExpiry });
      }

      const insertData = {
        license_code,
        membership_type,
        expires_at: newExpiry,
        status: "active",
        hwid: null // Belum terikat HWID saat digenerate admin
      };
      if (owner != null) insertData.owner = owner;
      if (program_type != null) insertData.program_type = program_type;
      const { error } = await getSupabase().from("licenses").insert(insertData);

      if (error) throw error;
      return ok(res, { license_code, expires_at: newExpiry });
    }

    let attempts = 0;
    while (true) {
      license_code = `${prefix}-${randomGroup()}-${randomGroup()}-${randomGroup()}`;
      const { data } = await getSupabase()
        .from("licenses")
        .select("id")
        .eq("license_code", license_code)
        .maybeSingle();

      if (!data) break;
      if (++attempts > 10) {
        return fail(res, "Could not generate unique code", 500);
      }
    }

    const expires_at =
      membership_type === "lifetime"
        ? new Date(Date.now() + 36500 * 86400000).toISOString()
        : new Date(Date.now() + duration_days * 86400000).toISOString();

    const insertData = {
      license_code,
      membership_type,
      expires_at,
      status: "active",
      hwid: null // Belum terikat HWID saat digenerate admin
    };
    if (owner != null) insertData.owner = owner;
    if (program_type != null) insertData.program_type = program_type;
    const { error } = await getSupabase().from("licenses").insert(insertData);

    if (error) throw error;
    return ok(res, { license_code, expires_at });
  } catch (err) {
    return fail(res, err.message || "Internal error", 500);
  }
});

/* ---------- ADMIN: extend-license ---------- */

app.post("/api/extend-license", adminAuth, adminLimiter, async (req, res) => {
  try {
    const { license_code, duration_days, owner: extOwner } = req.body;

    if (!license_code || !isValidLicenseCode(license_code)) {
      return fail(res, "Invalid license code format");
    }

    if (!isValidDuration(duration_days)) {
      return fail(res, "Duration must be between 1 and 3650 days");
    }

    const { data: existing, error: fetchError } = await getSupabase()
      .from("licenses")
      .select("id, expires_at, status")
      .eq("license_code", license_code)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) return fail(res, "License code not found", 404);

    const currentExpiry = new Date(existing.expires_at);
    const now = new Date();
    const base = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(
      base.getTime() + duration_days * 86400000
    ).toISOString();

    const extData = {
      expires_at: newExpiry,
      last_used_at: now.toISOString(),
      status: "active",
    };
    if (extOwner != null) extData.owner = extOwner;
    if (req.body.program_type !== undefined) extData.program_type = req.body.program_type;
    const { error: updateError } = await getSupabase()
      .from("licenses")
      .update(extData)
      .eq("license_code", license_code);

    if (updateError) throw updateError;

    return ok(res, { license_code, expires_at: newExpiry });
  } catch (err) {
    return fail(res, err.message || "Internal error", 500);
  }
});

/* ---------- ADMIN: suspend-license (toggle) ---------- */

app.post("/api/suspend-license", adminAuth, adminLimiter, async (req, res) => {
  try {
    const { license_code } = req.body;

    if (!license_code || !isValidLicenseCode(license_code)) {
      return fail(res, "Invalid license code format");
    }

    const { data: existing, error: fetchError } = await getSupabase()
      .from("licenses")
      .select("id, status")
      .eq("license_code", license_code)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) return fail(res, "License code not found", 404);

    const newStatus =
      existing.status === "suspended" ? "active" : "suspended";

    const { error } = await getSupabase()
      .from("licenses")
      .update({ status: newStatus })
      .eq("license_code", license_code);

    if (error) throw error;

    return ok(res, {
      license_code,
      status: newStatus,
      message: `License ${newStatus === "active" ? "unsuspended" : "suspended"}`,
    });
  } catch (err) {
    return fail(res, err.message || "Internal error", 500);
  }
});

/* ---------- ADMIN: reset-hwid (BARU) ---------- */

app.post("/api/reset-hwid", adminAuth, adminLimiter, async (req, res) => {
  try {
    const { license_code } = req.body;

    if (!license_code || !isValidLicenseCode(license_code)) {
      return fail(res, "Invalid license code format");
    }

    const { error } = await getSupabase()
      .from("licenses")
      .update({ hwid: null })
      .eq("license_code", license_code);

    if (error) throw error;

    return ok(res, { message: "HWID reset successfully" });
  } catch (err) {
    return fail(res, err.message || "Internal error", 500);
  }
});

/* ---------- ADMIN: update-license (program_type, owner) ---------- */

app.post("/api/update-license", adminAuth, adminLimiter, async (req, res) => {
  try {
    const { license_code, program_type, owner } = req.body;

    if (!license_code || !isValidLicenseCode(license_code)) {
      return fail(res, "Invalid license code format");
    }

    const { data: existing, error: fetchError } = await getSupabase()
      .from("licenses")
      .select("id")
      .eq("license_code", license_code)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) return fail(res, "License code not found", 404);

    const updateData = {};
    if (program_type !== undefined) updateData.program_type = program_type;
    if (owner !== undefined) updateData.owner = owner;

    const { error } = await getSupabase()
      .from("licenses")
      .update(updateData)
      .eq("license_code", license_code);

    if (error) throw error;

    return ok(res, { message: "License updated" });
  } catch (err) {
    return fail(res, err.message || "Internal error", 500);
  }
});

/* ---------- ADMIN: delete-license ---------- */

app.delete("/api/licenses", adminAuth, adminLimiter, async (req, res) => {
  try {
    const { license_code } = req.body;

    if (!license_code || !isValidLicenseCode(license_code)) {
      return fail(res, "Invalid license code format");
    }

    const { data: existing, error: fetchError } = await getSupabase()
      .from("licenses")
      .select("id")
      .eq("license_code", license_code)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) return fail(res, "License code not found", 404);

    const { error } = await getSupabase()
      .from("licenses")
      .delete()
      .eq("license_code", license_code);

    if (error) throw error;

    return ok(res, { message: "License deleted" });
  } catch (err) {
    return fail(res, err.message || "Internal error", 500);
  }
});

/* ---------- serve static frontend ---------- */

app.use(express.static("frontend/dist"));

/* ---------- start / export ---------- */

const PORT = process.env.PORT || 3000;
const isVercel = process.env.VERCEL === "1";

if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Auto cleanup & trial generation every 3 days at 00:00
  cron.schedule("0 0 */3 * *", async () => {
    console.log("[Cron] Running scheduled cleanup & trial generation...");
    try {
      // 1. Hapus license yang expired
      const { data: deleted, error: delError } = await getSupabase()
        .from("licenses")
        .delete()
        .lt("expires_at", new Date().toISOString())
        .select("id");

      if (delError) {
        console.error("[Cron] Delete expired error:", delError.message);
      } else {
        console.log(`[Cron] Deleted ${deleted?.length ?? 0} expired license(s)`);
      }

      // 2. Generate 1 trial license
      let license_code;
      let attempts = 0;

      while (true) {
        license_code = `TRIAL-${randomGroup()}-${randomGroup()}-${randomGroup()}`;
        const { data } = await getSupabase()
          .from("licenses")
          .select("id")
          .eq("license_code", license_code)
          .maybeSingle();

        if (!data) break;
        if (++attempts > 10) {
          console.error("[Cron] Could not generate unique trial code");
          return;
        }
      }

      const expires_at = new Date(
        Date.now() + 3 * 24 * 60 * 60000
      ).toISOString();

      const { error: insError } = await getSupabase()
        .from("licenses")
        .insert({
          license_code,
          membership_type: "trial",
          expires_at,
          status: "active",
        });

      if (insError) {
        console.error("[Cron] Trial insert error:", insError.message);
      } else {
        console.log(`[Cron] Trial generated: ${license_code} (expires ${expires_at})`);
      }
    } catch (err) {
      console.error("[Cron] Error:", err.message);
    }
  });
}

export default app;