import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabase.ts";

const BASE = "https://mrynitasirdzzfsmcaqh.supabase.co/functions/v1";

const HTML = (rows: string) => `<!DOCTYPE html>
<html>
<head><title>License Dashboard</title></head>
<body>
<h2>License Dashboard</h2>
<div id="msg"></div>
<hr>
<form onsubmit="event.preventDefault();generate()">
  Type: <select id="genType"><option>monthly</option><option>weekly</option><option>yearly</option><option>lifetime</option></select>
  Days: <input id="genDays" type="number" value="30" style="width:60px">
  Phone: <input id="genPhone" style="width:140px">
  <button type="submit">Generate</button>
  <button type="button" onclick="generateTrial()">Trial 1h</button>
</form>
<hr>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
<tr><th>Code</th><th>Type</th><th>Program</th><th>Owner</th><th>Expires</th><th>Last Used</th><th>Status</th><th>Action</th></tr>
${rows}
</table>
<script>
const B="${BASE}";
function show(t,e){const m=document.getElementById("msg");m.innerHTML="<b>"+(e?"Error: ":"OK: ")+t+"</b>";setTimeout(()=>location.reload(),1500)}
function generate(){const t=genType.value,d=genDays.value,p=genPhone.value.trim();const b={membership_type:t};if(t!="lifetime")b.duration_days=+d;if(p)b.phone=p;fetch(B+"/generate-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}).then(r=>r.json()).then(d=>show(d.license_code||d.error,!d.success))}
function generateTrial(){fetch(B+"/generate-trial",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"}).then(r=>r.json()).then(d=>show(d.license_code||d.error,!d.success))}
function extendLicense(c){const d=prompt("Days:",30);if(d)fetch(B+"/extend-license",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({license_code:c,duration_days:+d})}).then(r=>r.json()).then(r=>show(r.success?"Extended":r.error,!r.success))}
function suspendLicense(c){if(confirm("Suspend?"))fetch(B+"/suspend-license",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({license_code:c})}).then(r=>r.json()).then(r=>show(r.success?"Suspended":r.error,!r.success))}
function deleteLicense(c){if(confirm("Delete?"))fetch(B+"/delete-license",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({license_code:c})}).then(r=>r.json()).then(r=>show(r.success?"Deleted":r.error,!r.success))}
function updateProgram(c){const p=prompt("Program type:");if(p!==null)fetch(B+"/update-license",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({license_code:c,program_type:p})}).then(r=>r.json()).then(r=>show(r.success?"Program Updated":r.error,!r.success))}
function updateOwner(c){const o=prompt("Owner:");if(o!==null)fetch(B+"/update-license",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({license_code:c,owner:o})}).then(r=>r.json()).then(r=>show(r.success?"Owner Updated":r.error,!r.success))}
</script>
</body>
</html>`;

serve(async (req) => {
  const { data, error } = await supabase
    .from("licenses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return new Response("DB error", { status: 500, headers: corsHeaders });
  }

  const rows = data?.map((l) => {
    const code = l.license_code;
    const expires = l.membership_type === "lifetime" ? "Lifetime" : new Date(l.expires_at).toLocaleString();
    const lastUsed = l.last_used_at ? new Date(l.last_used_at).toLocaleString() : "-";
    return `<tr>
      <td><code>${code}</code></td>
      <td>${l.membership_type}</td>
      <td>${l.program_type || "-"}</td>
      <td>${l.owner || "-"}</td>
      <td>${expires}</td>
      <td>${lastUsed}</td>
      <td>${l.status}</td>
      <td>
        <button onclick="extendLicense('${code}')">Extend</button>
        <button onclick="updateProgram('${code}')">Program</button>
        <button onclick="updateOwner('${code}')">Owner</button>
        <button onclick="suspendLicense('${code}')">Suspend</button>
        <button onclick="deleteLicense('${code}')">Delete</button>
      </td>
    </tr>`;
  }).join("") || "";

  return new Response(HTML(rows), {
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
});
