const cron = require('node-cron');
const { db } = require('../config/db');
const { sendToUser } = require('./notificationService');

const startScheduledNotifications = () => {

  // ==========================================
  // Har roz subah 9 AM — Aaj ke follow-ups
  // Sales rep + Manager dono ko
  // ==========================================
  cron.schedule('0 9 * * *', async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [leads] = await db.query(
        `SELECT l.id, l.lead_code, l.customer_name,
                l.assigned_to, u.manager_id
         FROM leads l
         LEFT JOIN users u ON l.assigned_to = u.id
         WHERE DATE(l.next_follow_up_date) = ?
           AND l.is_deleted = 0
           AND l.status NOT IN ('Won', 'Lost', 'Not Interested')`,
        [today]
      );

      for (const lead of leads) {
        if (lead.assigned_to) {
          await sendToUser(lead.assigned_to, {
            title: '📅 Follow-up Today',
            body: `${lead.customer_name} (${lead.lead_code}) — follow-up aaj scheduled hai.`,
            type: 'followup_today',
            referenceId: lead.id,
          });
        }
        if (lead.manager_id) {
          await sendToUser(lead.manager_id, {
            title: '📅 Team Follow-up Today',
            body: `${lead.customer_name} (${lead.lead_code}) — team ka follow-up aaj hai.`,
            type: 'followup_today',
            referenceId: lead.id,
          });
        }
      }
      console.log(`Follow-up reminders sent for ${leads.length} leads.`);
    } catch (err) {
      console.error('Follow-up reminder error:', err);
    }
  }, { timezone: 'Asia/Kolkata' });

  // ==========================================
  // Har roz subah 8 AM — Kal ki Site Visits
  // Sales rep ko 1 din pehle remind karo
  // ==========================================
  cron.schedule('0 8 * * *', async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);

      const [leads] = await db.query(
        `SELECT l.id, l.lead_code, l.customer_name, l.assigned_to
         FROM leads l
         WHERE DATE(l.site_visit_date) = ?
           AND l.is_deleted = 0`,
        [tomorrowStr]
      );

      for (const lead of leads) {
        if (lead.assigned_to) {
          await sendToUser(lead.assigned_to, {
            title: '🏠 Site Visit Tomorrow',
            body: `${lead.customer_name} (${lead.lead_code}) — site visit kal scheduled hai. Taiyar raho!`,
            type: 'site_visit_reminder',
            referenceId: lead.id,
          });
        }
      }
      console.log(`Site visit reminders sent for ${leads.length} leads.`);
    } catch (err) {
      console.error('Site visit reminder error:', err);
    }
  }, { timezone: 'Asia/Kolkata' });

  // ==========================================
  // Har roz shaam 6 PM — Overdue Follow-ups
  // Sales rep ko batao kitni leads overdue hain
  // ==========================================
  cron.schedule('0 18 * * *', async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);

      const [reps] = await db.query(
        `SELECT l.assigned_to, COUNT(*) as overdue_count
         FROM leads l
         WHERE DATE(l.next_follow_up_date) < ?
           AND l.is_deleted = 0
           AND l.status NOT IN ('Won', 'Lost', 'Not Interested')
           AND l.assigned_to IS NOT NULL
         GROUP BY l.assigned_to`,
        [today]
      );

      for (const rep of reps) {
        await sendToUser(rep.assigned_to, {
          title: '⚠️ Overdue Follow-ups',
          body: `Tumhare ${rep.overdue_count} follow-up(s) overdue hain. Aaj action lo!`,
          type: 'overdue_summary',
          referenceId: null,
        });
      }
      console.log(`Overdue reminders sent to ${reps.length} reps.`);
    } catch (err) {
      console.error('Overdue summary error:', err);
    }
  }, { timezone: 'Asia/Kolkata' });

  // ==========================================
  // Har Somwar subah 9 AM — Weekly Summary
  // Manager ko poori team ka weekly report
  // ==========================================
  cron.schedule('0 9 * * 1', async () => {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().slice(0, 10);

      const [managers] = await db.query(
        "SELECT id FROM users WHERE role_id = 2 AND status = 'Active'"
      );

      for (const manager of managers) {
        const [stats] = await db.query(
          `SELECT
            COUNT(*) as total,
            SUM(CASE WHEN l.status = 'Won' THEN 1 ELSE 0 END) as won,
            SUM(CASE WHEN l.status = 'Lost' THEN 1 ELSE 0 END) as lost
           FROM leads l
           LEFT JOIN users u ON l.assigned_to = u.id
           WHERE u.manager_id = ?
             AND l.created_at >= ?
             AND l.is_deleted = 0`,
          [manager.id, weekAgoStr]
        );

        const s = stats[0];
        await sendToUser(manager.id, {
          title: '📊 Weekly Team Summary',
          body: `Is hafte: ${s.total} leads, ${s.won || 0} Won, ${s.lost || 0} Lost.`,
          type: 'weekly_summary',
          referenceId: null,
        });
      }
      console.log(`Weekly summaries sent to ${managers.length} managers.`);
    } catch (err) {
      console.error('Weekly summary error:', err);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('✅ Scheduled notifications started (IST timezone)');
};

module.exports = { startScheduledNotifications };