# Google sign-in and article authoring setup

The site can stay public for reading. Supabase Auth handles Google sign-in, while PostgreSQL row-level security decides who can create, edit, or delete articles. Do not use a service-role key in the browser.

1. Create a Supabase project and run `supabase/schema.sql` in its SQL Editor. For a project created with the earlier school-domain version, run `supabase/migrations/20261108_remove_school_email_domain_check.sql` instead.
2. To grant writing access, add each approved Google account's full email to `private.writer_allowlist`. The email does not need to use a school domain.
3. In Supabase Auth, enable Google and configure its OAuth client in the Supabase Dashboard. Add the site's real HTTPS origin to the Google OAuth client and the Supabase redirect allow list.
4. Put the Supabase project URL and anon key in `supabase-config.js`. The anon key is meant for the browser; never put the service-role key there.
5. Serve the site from `http://localhost:<port>` while developing or from its deployed HTTPS address. OAuth cannot return to a `file://` page.

Google sign-in accepts Google accounts without checking their email domain. The database still permits article editing only for exact email addresses in `private.writer_allowlist`. Administrator controls for opening and closing a writing period are not implemented yet.
