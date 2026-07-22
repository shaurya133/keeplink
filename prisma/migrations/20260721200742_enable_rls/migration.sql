-- Enable Row Level Security (RLS) on all public tables.
--
-- This app connects to Postgres directly via Prisma using the privileged
-- `postgres` role, which has BYPASSRLS. It does NOT use the Supabase client
-- SDK, the anon key, or the auto-generated PostgREST Data API.
--
-- With RLS disabled, Supabase still exposes every public table through the
-- Data API to anyone holding the (public, non-secret) anon key. Enabling RLS
-- with NO policies closes that door: PostgREST access for the anon/authenticated
-- roles is denied, while Prisma's privileged connection continues to bypass RLS.
-- Nothing in the app changes.
--
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY is idempotent, so this is safe to
-- run even if RLS was already enabled manually in the Supabase dashboard.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Link" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Highlight" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LinkTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Defense in depth: revoke all table privileges from the Data API roles so that
-- even a future misconfiguration (e.g. a policy added by mistake) cannot expose
-- data through PostgREST. The app does not use these roles.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
