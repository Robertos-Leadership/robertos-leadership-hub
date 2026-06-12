# Notification setup - handoff status (12 Jun 2026)

DONE:
- tasks.due_notified_at column exists
- team_members table populated (7 members, Alper excluded - leaving)
- cron job 'due-task-emails' scheduled 0 9 * * * UTC (13:00 Dubai) - currently
  points at old edge-function URL OR at send_due_task_emails() depending on
  whether setup-notifications.sql ran
- App (preview.html) clears due_notified_at when due date edited - NOT yet pushed to live index.html
- 5 due tasks assigned to Francesco for testing

REMAINING:
1. Run notifications/setup-notifications.sql in SQL editor (needs Resend API key
   from Francesco replacing PASTE_RESEND_KEY_HERE) - creates send_due_task_emails()
   and re-points the cron job
2. Test: POST /rest/v1/rpc/send_due_task_emails with anon key -> Francesco should
   receive digest email -> verify due_notified_at stamped
3. Push preview.html -> index.html (stamp-clearing change) after Francesco approves
4. If test emails fail (wrong key): clear stamps with
   update tasks set due_notified_at=null where due_notified_at is not null;

NOTE: priority lives as JSON in tasks.description, NOT a column.
