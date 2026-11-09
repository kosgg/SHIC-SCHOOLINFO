# Google sign-in, article writing, and administrator settings

Published articles remain readable without signing in. Google sign-in lets users read their own drafts and create, edit, or delete their own articles only while the administrator-controlled writing period is open. PostgreSQL row-level security enforces the same rules, so hiding the form is not the security boundary.

## Database setup

- For the existing Supabase project, run `supabase/migrations/20261109_admin_writing_window.sql` in its SQL Editor. It adds a closed writing-period setting and replaces the old write policies without deleting article rows or the existing writer allowlist.
- For a new project, run `supabase/schema.sql`.
- The old `private.writer_allowlist` table and its rows are retained for compatibility. Current policies do not read it. The old `is_authorized_writer()` RPC is revoked from client roles by the migration.

## Google OAuth

Enable Google in Supabase Auth and configure it with the Web OAuth Client ID and Client Secret from Google Cloud. Register the deployed site as an authorized JavaScript origin in Google Cloud. Register the Supabase Auth callback URL as the Google OAuth redirect URI. Set the deployed site as the Supabase Site URL and add it to the Supabase redirect URL allowlist.

The client-side `supabase-config.js` contains only the Supabase URL and publishable/anon key. Never place a service-role key, Google Client Secret, or other server secret in browser code or GitHub.

## Administrator and writing period

- The sole administrator is the verified Google account `hongsg821@gmail.com`.
- The administrator opens **글쓰기 설정**, enters a start and end time in Korea time, saves the period, then enables writing. Turning it off immediately denies writes; the database also closes automatically at the end time.
- The start and end times are stored as `timestamptz` values in `private.article_writing_settings`. The UI explicitly parses and displays `Asia/Seoul`; the database compares absolute timestamps.
- New installations begin with an empty, closed period. Users cannot write until the administrator sets both times and opens the period.
- Admin-only RPCs return or update the schedule. Other authenticated users can only query whether writing is currently open; they cannot read the scheduled start/end values or modify them.

The Google OAuth provider must also allow the intended audience. During Google OAuth testing, only listed test users may be able to sign in; configure production audience access when the site is ready for broader use.
