
CREATE TABLE public.tpo_credentials (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  eps_token TEXT NOT NULL,
  eps_uid TEXT NOT NULL,
  eps_tenant TEXT NOT NULL,
  eps_userid_token TEXT,
  cv_file_id TEXT,
  api_base TEXT NOT NULL DEFAULT 'https://tpoapi.vierp.in',
  companies_path TEXT NOT NULL DEFAULT '/company-offering/get-all-active-companies',
  company_detail_path TEXT NOT NULL DEFAULT '/company-offering/get-company-by-id',
  apply_path TEXT NOT NULL DEFAULT '/student-companyoffering/apply-to-company',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tpo_credentials TO authenticated;
GRANT ALL ON public.tpo_credentials TO service_role;
ALTER TABLE public.tpo_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own creds" ON public.tpo_credentials FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_offering_id TEXT NOT NULL,
  company_name TEXT,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'submitted',
  tpo_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own apps" ON public.applications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX applications_user_idx ON public.applications(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER tpo_credentials_touch BEFORE UPDATE ON public.tpo_credentials
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
