CREATE OR REPLACE FUNCTION public.account_is_active(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT _user_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id AND suspended_at IS NULL); $$;
REVOKE ALL ON FUNCTION public.account_is_active(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.account_is_active(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.has_section_permission(_user_id uuid, _section text, _action text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.account_is_active(_user_id) AND (public.has_role(_user_id, 'admin') OR ((public.has_role(_user_id, 'editor') OR public.has_role(_user_id, 'colaborador')) AND EXISTS (SELECT 1 FROM public.editor_permissions ep WHERE ep.user_id = _user_id AND ep.section = _section AND CASE _action WHEN 'create' THEN ep.can_create WHEN 'edit' THEN ep.can_edit WHEN 'delete' THEN ep.can_delete WHEN 'publish' THEN ep.can_publish WHEN 'read' THEN ep.can_create OR ep.can_edit OR ep.can_delete OR ep.can_publish ELSE false END))); $$;

CREATE OR REPLACE FUNCTION public.can_manage_section(_section text, _action text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'admin') OR (NOT public.is_country_editor(auth.uid()) AND public.has_section_permission(auth.uid(), _section, _action)); $$;
REVOKE ALL ON FUNCTION public.can_manage_section(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_section(text,text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_access_own_editorial(_owner uuid, _country text, _section_id uuid, _kind text, _action text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'admin') OR (public.account_is_active(auth.uid()) AND _owner = auth.uid() AND public.has_section_permission(auth.uid(), _kind, _action) AND CASE WHEN public.is_country_editor(auth.uid()) THEN public.can_edit_country(auth.uid(), _country) ELSE public.has_assigned_section(auth.uid()) AND _section_id = public.current_user_section_id() END); $$;
REVOKE ALL ON FUNCTION public.can_access_own_editorial(uuid,text,uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_own_editorial(uuid,text,uuid,text,text) TO anon, authenticated, service_role;

DO $$ DECLARE p record; sec text; act text; q text; w text; repl text;
BEGIN
 FOR p IN SELECT * FROM pg_policies WHERE schemaname='public' AND tablename NOT IN ('news','interviews','profiles','editor_permissions','editor_countries','user_roles') AND (COALESCE(qual,'') || COALESCE(with_check,'')) ~ '(editor|is_editorial_staff)' LOOP
  sec := CASE WHEN p.tablename IN ('events','event_clubs','event_federations','event_skaters','schedule_items','live_timeline') THEN 'eventos' WHEN p.tablename IN ('live_results','result_events','results','races','result_documents','result_csv_mappings','result_skaters','asu26_results_links','results_sync_state') THEN 'resultados' WHEN p.tablename IN ('tv_settings','tv_broadcasts','tv_highlights','live_stream') THEN 'rollerzone-tv' WHEN p.tablename IN ('ad_banners','ad_banner_placements','sponsors') THEN 'publicidad' WHEN p.tablename='magazines' THEN 'revista' ELSE p.tablename END;
  act := CASE p.cmd WHEN 'SELECT' THEN 'read' WHEN 'INSERT' THEN 'create' WHEN 'UPDATE' THEN 'edit' WHEN 'DELETE' THEN 'delete' ELSE 'publish' END;
  repl := format('public.can_manage_section(%L,%L)',sec,act);
  q := replace(replace(replace(p.qual,'has_role(auth.uid(), ''editor''::app_role)',repl),'has_role(auth.uid(), ''colaborador''::app_role)',repl),'is_editorial_staff(auth.uid())',repl);
  w := replace(replace(replace(p.with_check,'has_role(auth.uid(), ''editor''::app_role)',repl),'has_role(auth.uid(), ''colaborador''::app_role)',repl),'is_editorial_staff(auth.uid())',repl);
  EXECUTE format('ALTER POLICY %I ON public.%I%s%s',p.policyname,p.tablename,CASE WHEN q IS NULL THEN '' ELSE ' USING ('||q||')' END,CASE WHEN w IS NULL THEN '' ELSE ' WITH CHECK ('||w||')' END);
 END LOOP;
END $$;

DO $$ DECLARE p record;
BEGIN
 FOR p IN SELECT * FROM pg_policies WHERE schemaname='public' AND tablename IN ('news','interviews') LOOP EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,p.tablename); END LOOP;
END $$;
CREATE POLICY "News public and authorized owner read" ON public.news FOR SELECT TO anon, authenticated USING (published = true OR public.has_role(auth.uid(),'admin') OR public.can_access_own_editorial(created_by,country_code,section_id,'noticias','read'));
CREATE POLICY "News authorized draft insert" ON public.news FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR (status IN ('draft','pending') AND NOT published AND public.can_access_own_editorial(created_by,country_code,section_id,'noticias','create')));
CREATE POLICY "News authorized draft update" ON public.news FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR (status IN ('draft','pending','rejected') AND NOT published AND public.can_access_own_editorial(created_by,country_code,section_id,'noticias','edit'))) WITH CHECK (public.has_role(auth.uid(),'admin') OR (status IN ('draft','pending') AND NOT published AND public.can_access_own_editorial(created_by,country_code,section_id,'noticias','edit')));
CREATE POLICY "News administrator delete" ON public.news FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Interviews public and authorized owner read" ON public.interviews FOR SELECT TO anon, authenticated USING (published = true OR public.has_role(auth.uid(),'admin') OR public.can_access_own_editorial(created_by,country_code,NULL,'entrevistas','read'));
CREATE POLICY "Interviews authorized draft insert" ON public.interviews FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR (status IN ('draft','pending') AND NOT published AND public.can_access_own_editorial(created_by,country_code,NULL,'entrevistas','create')));
CREATE POLICY "Interviews authorized draft update" ON public.interviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR (status IN ('draft','pending','rejected') AND NOT published AND public.can_access_own_editorial(created_by,country_code,NULL,'entrevistas','edit'))) WITH CHECK (public.has_role(auth.uid(),'admin') OR (status IN ('draft','pending') AND NOT published AND public.can_access_own_editorial(created_by,country_code,NULL,'entrevistas','edit')));
CREATE POLICY "Interviews administrator delete" ON public.interviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.protect_editorial_control_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ DECLARE protected jsonb;
BEGIN
 IF auth.uid() IS NULL OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
 IF NOT public.account_is_active(auth.uid()) THEN RAISE EXCEPTION 'account suspended' USING ERRCODE='42501'; END IF;
 IF TG_OP='UPDATE' THEN
  IF NEW.country_code IS DISTINCT FROM OLD.country_code OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN RAISE EXCEPTION 'editorial ownership and territory are immutable' USING ERRCODE='42501'; END IF;
  protected := jsonb_build_object('approved_by',to_jsonb(OLD)->'approved_by','approved_at',to_jsonb(OLD)->'approved_at','published_by',to_jsonb(OLD)->'published_by','published_at',to_jsonb(OLD)->'published_at','review_feedback',to_jsonb(OLD)->'review_feedback');
 ELSE protected := jsonb_build_object('approved_by',NULL,'approved_at',NULL,'published_by',NULL,'published_at',NULL,'review_feedback',NULL); END IF;
 NEW := jsonb_populate_record(NEW, protected);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.protect_editorial_control_fields() FROM PUBLIC;
CREATE TRIGGER aaa_protect_news_controls BEFORE INSERT OR UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.protect_editorial_control_fields();
CREATE TRIGGER aaa_protect_interview_controls BEFORE INSERT OR UPDATE ON public.interviews FOR EACH ROW EXECUTE FUNCTION public.protect_editorial_control_fields();

CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN
 IF auth.uid() IS NOT NULL AND NOT (public.has_role(auth.uid(),'admin') AND public.mfa_satisfied()) THEN
  IF TG_OP='INSERT' THEN
   IF NEW.suspended_at IS NOT NULL OR NEW.section_id IS NOT NULL THEN RAISE EXCEPTION 'privileged profile fields require administrator' USING ERRCODE='42501'; END IF;
  ELSIF NEW.suspended_at IS DISTINCT FROM OLD.suspended_at OR NEW.section_id IS DISTINCT FROM OLD.section_id OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN RAISE EXCEPTION 'privileged profile fields require administrator' USING ERRCODE='42501'; END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.protect_profile_privileges() FROM PUBLIC;
CREATE TRIGGER protect_profile_privileges BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

DO $$ DECLARE t record;
BEGIN
 FOR t IN SELECT c.relname FROM pg_class c WHERE c.relnamespace='public'::regnamespace AND c.relkind='r' AND c.relrowsecurity LOOP
  EXECUTE format('CREATE POLICY "Active account protected access" ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (public.account_is_active(auth.uid())) WITH CHECK (public.account_is_active(auth.uid()))',t.relname);
 END LOOP;
END $$;

DO $$ DECLARE p record; q text; w text;
BEGIN
 FOR p IN SELECT * FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%editor%' LOOP
  q := replace(p.qual,'has_role(auth.uid(), ''editor''::app_role)','has_role(auth.uid(), ''admin''::app_role)');
  w := replace(p.with_check,'has_role(auth.uid(), ''editor''::app_role)','has_role(auth.uid(), ''admin''::app_role)');
  EXECUTE format('ALTER POLICY %I ON storage.objects%s%s',p.policyname,CASE WHEN q IS NULL THEN '' ELSE ' USING ('||q||')' END,CASE WHEN w IS NULL THEN '' ELSE ' WITH CHECK ('||w||')' END);
 END LOOP;
END $$;
CREATE POLICY "Active account file access" ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated USING (public.account_is_active(auth.uid())) WITH CHECK (public.account_is_active(auth.uid()));
CREATE POLICY "Editors upload own article media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='media' AND owner_id=auth.uid()::text AND public.account_is_active(auth.uid()) AND ((split_part(name,'/',1)='news' AND public.has_section_permission(auth.uid(),'noticias','create')) OR (split_part(name,'/',1)='interviews' AND public.has_section_permission(auth.uid(),'entrevistas','create'))) AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','avif','gif','mp4','webm','mov','m4v') AND octet_length(name)<=300);
CREATE POLICY "Editors read own article media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='media' AND owner_id=auth.uid()::text AND public.account_is_active(auth.uid()) AND (public.has_section_permission(auth.uid(),'noticias','read') OR public.has_section_permission(auth.uid(),'entrevistas','read')));

CREATE OR REPLACE FUNCTION public.admin_list_community_submissions()
RETURNS SETOF public.community_submissions LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$ BEGIN IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'insufficient privileges' USING ERRCODE='42501'; END IF; RETURN QUERY SELECT * FROM public.community_submissions ORDER BY created_at DESC; END $$;

CREATE OR REPLACE FUNCTION public.convert_live_to_result_event(_event_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ DECLARE ev RECORD; new_id uuid; new_slug text;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'insufficient privileges' USING ERRCODE='42501'; END IF;
 SELECT * INTO ev FROM public.events WHERE id=_event_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'event not found'; END IF;
 IF ev.converted_result_event_id IS NOT NULL THEN RETURN ev.converted_result_event_id; END IF;
 new_slug := COALESCE(ev.slug,'evento-' || substr(_event_id::text,1,8));
 INSERT INTO public.result_events(slug,name,event_date,country,banner_url,status,sort_order,published,city,venue,stream_url,competition_type,season) VALUES(new_slug,ev.name,ev.start_date::date,COALESCE(ev.country,NULL),ev.cover_url,'finalizado',0,true,ev.location,ev.location,ev.cover_url,'evento',to_char(COALESCE(ev.start_date,now()),'YYYY')) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id INTO new_id;
 UPDATE public.events SET converted_result_event_id=new_id WHERE id=_event_id;
 RETURN new_id;
END $$;
REVOKE ALL ON FUNCTION public.convert_live_to_result_event(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.convert_live_to_result_event(uuid) TO authenticated, service_role;