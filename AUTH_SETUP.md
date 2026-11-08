# Google sign-in and article authoring setup

The site can stay public for reading. Supabase Auth handles Google sign-in, while PostgreSQL row-level security decides who can create, edit, or delete articles. Do not use a service-role key in the browser.

1. Create a Supabase project and run `supabase/schema.sql` in its SQL Editor.
2. In the SQL Editor, replace the example school domain with the real Google Workspace domain, then add each approved writer's full school email to `private.writer_allowlist`.
3. In Supabase Auth, enable Google and configure its OAuth client in the Supabase Dashboard. Add the site's real HTTPS origin to the Google OAuth client and the Supabase redirect allow list.
4. Put the Supabase project URL, anon key, and school email domain in `supabase-config.js`. The anon key is meant for the browser; never put the service-role key there.
5. Serve the site from `http://localhost:<port>` while developing or from its deployed HTTPS address. OAuth cannot return to a `file://` page.

Google's `hd` OAuth parameter only guides account selection. The app also checks the signed-in domain, and the database verifies both the domain and exact writer allowlist before allowing writes.
