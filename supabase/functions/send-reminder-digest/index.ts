import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const parseDateOnly = (dateStr: string): Date => {
  const raw = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [y, m, d] = raw.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const todayUtc = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const diffDays = (date: Date) => Math.round((date.getTime() - todayUtc().getTime()) / 86400000);

interface DigestItem {
  title: string;
  subtitle: string;
  days: number | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Email is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(resendApiKey);
    const baseUrl = Deno.env.get("APP_BASE_URL") || "https://clawops.com";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const [{ data: profiles }, { data: prefsRows }, { data: leads }, { data: locations }, { data: machines }, { data: dismissals }] =
      await Promise.all([
        supabase.from("profiles").select("user_id, email, full_name, email_notifications_enabled"),
        supabase.from("reminder_preferences").select("*"),
        supabase
          .from("leads")
          .select("id, user_id, business_name, status, next_follow_up, target_install_date"),
        supabase.from("locations").select("id, user_id, name, is_active"),
        supabase.from("location_machines").select("id, location_id, machine_type, custom_label, installed_at"),
        supabase.from("reminder_dismissals").select("user_id, source_type, source_id, snoozed_until"),
      ]);

    const today = todayUtc();
    let sent = 0;

    for (const profile of profiles || []) {
      if (!profile.email || profile.email_notifications_enabled === false) continue;

      const prefs = (prefsRows || []).find((p) => p.user_id === profile.user_id);
      const leadEnabled = prefs?.lead_followup_enabled ?? true;
      const installEnabled = prefs?.install_enabled ?? true;
      const leadDays = prefs?.lead_followup_days_before ?? 3;
      const installDays = prefs?.install_days_before ?? 3;

      const userDismissals = (dismissals || []).filter((d) => d.user_id === profile.user_id);
      const isDismissed = (type: string, id: string) => {
        const d = userDismissals.find((x) => x.source_type === type && x.source_id === id);
        if (!d) return false;
        if (!d.snoozed_until) return true;
        return parseDateOnly(d.snoozed_until) > today;
      };

      const items: DigestItem[] = [];
      const userLeads = (leads || []).filter((l) => l.user_id === profile.user_id);

      if (leadEnabled) {
        for (const lead of userLeads) {
          if (lead.status === "won" || lead.status === "lost") continue;
          if (!lead.next_follow_up) continue;
          const days = diffDays(parseDateOnly(lead.next_follow_up));
          if (days > leadDays) continue;
          if (isDismissed("lead_followup", lead.id)) continue;
          items.push({ title: lead.business_name, subtitle: "Lead follow-up", days });
        }
      }

      if (installEnabled) {
        for (const lead of userLeads) {
          if (lead.status === "lost") continue;
          if (!lead.target_install_date) continue;
          const days = diffDays(parseDateOnly(lead.target_install_date));
          if (days > installDays) continue;
          if (isDismissed("lead_install", lead.id)) continue;
          items.push({ title: lead.business_name, subtitle: "Installation deadline", days });
        }

        const userLocations = (locations || []).filter((l) => l.user_id === profile.user_id && l.is_active !== false);
        for (const location of userLocations) {
          const locMachines = (machines || []).filter((m) => m.location_id === location.id && !m.installed_at);
          for (const machine of locMachines) {
            if (isDismissed("machine_install", machine.id)) continue;
            items.push({
              title: `${location.name} — ${machine.custom_label || machine.machine_type}`,
              subtitle: "Machine not marked installed",
              days: null,
            });
          }
        }
      }

      if (items.length === 0) continue;

      const overdue = items.filter((i) => i.days !== null && i.days < 0);
      const dueToday = items.filter((i) => i.days === 0);
      const upcoming = items.filter((i) => i.days === null || i.days > 0);

      const renderGroup = (label: string, group: DigestItem[]) => {
        if (group.length === 0) return "";
        const rows = group
          .map((i) => {
            const when =
              i.days === null
                ? "No install date"
                : i.days < 0
                ? `Overdue by ${Math.abs(i.days)} day(s)`
                : i.days === 0
                ? "Due today"
                : `In ${i.days} day(s)`;
            return `<li style="margin-bottom:6px;"><strong>${escapeHtml(i.title)}</strong> — ${escapeHtml(
              i.subtitle
            )} <span style="color:#888;">(${escapeHtml(when)})</span></li>`;
          })
          .join("");
        return `<h3 style="margin:20px 0 8px;font-size:15px;">${escapeHtml(label)}</h3><ul style="padding-left:18px;margin:0;">${rows}</ul>`;
      };

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
          <h2 style="margin-bottom:4px;">Your ClawOps reminders</h2>
          <p style="color:#666;margin-top:0;">Here's what needs attention today.</p>
          ${renderGroup("Overdue", overdue)}
          ${renderGroup("Due today", dueToday)}
          ${renderGroup("Coming up", upcoming)}
          <p style="margin-top:24px;">
            <a href="${escapeHtml(baseUrl)}/dashboard" style="background:#1E3A5F;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Open ClawOps</a>
          </p>
          <p style="color:#999;font-size:12px;margin-top:24px;">You can turn these off in Settings → Notifications.</p>
        </div>`;

      const { error } = await resend.emails.send({
        from: "ClawOps <noreply@clawops.com>",
        to: [profile.email],
        subject: `ClawOps reminders: ${items.length} item${items.length === 1 ? "" : "s"} need attention`,
        html,
      });

      if (error) {
        console.error("Failed to send digest to user", profile.user_id, error);
        continue;
      }
      sent++;
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-reminder-digest error:", error);
    return new Response(JSON.stringify({ error: "Failed to send reminder digest" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
