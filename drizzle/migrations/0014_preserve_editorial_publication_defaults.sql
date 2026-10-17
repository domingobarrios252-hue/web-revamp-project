CREATE OR REPLACE FUNCTION public.protect_editorial_control_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ DECLARE protected jsonb;
BEGIN
 IF auth.uid() IS NULL OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
 IF NOT public.account_is_active(auth.uid()) THEN RAISE EXCEPTION 'account suspended' USING ERRCODE='42501'; END IF;
 IF TG_OP='UPDATE' THEN
  IF NEW.country_code IS DISTINCT FROM OLD.country_code OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN RAISE EXCEPTION 'editorial ownership and territory are immutable' USING ERRCODE='42501'; END IF;
  protected := jsonb_build_object('approved_by',to_jsonb(OLD)->'approved_by','approved_at',to_jsonb(OLD)->'approved_at','published_by',to_jsonb(OLD)->'published_by','published_at',to_jsonb(OLD)->'published_at','review_feedback',to_jsonb(OLD)->'review_feedback');
 ELSE
  protected := jsonb_build_object('approved_by',NULL,'approved_at',NULL,'published_by',NULL,'review_feedback',NULL);
  IF TG_TABLE_NAME='news' THEN protected := protected || jsonb_build_object('published_at',now()); ELSE protected := protected || jsonb_build_object('published_at',NULL); END IF;
 END IF;
 NEW := jsonb_populate_record(NEW,protected);
 RETURN NEW;
END $$;