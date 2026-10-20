import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import postgres from "postgres";

// This test deliberately connects ONLY to the disposable local test database.
const sql = postgres({ host: "/tmp/i18n-db", port: 55439, user: "lovable", database: "postgres", max: 1 });
test("translation rules preserve workflows, reject privilege escalation, and roll back", async () => {
  const admin="00000000-0000-0000-0000-000000000001", fr="00000000-0000-0000-0000-000000000002", pt="00000000-0000-0000-0000-000000000003";
  let checks=0;
  try {
    await sql.begin(async tx => {
      await tx.unsafe(readFileSync("scripts/sql/news-translations-hardening.sql","utf8"));
      await tx.unsafe("GRANT USAGE ON SCHEMA auth TO authenticated,anon; GRANT SELECT ON public.news TO authenticated,anon;");
      for (const [id,role,country] of [[admin,"admin",null],[fr,"editor","fr"],[pt,"editor","pt"]]) {
        await tx`INSERT INTO public.profiles(user_id) VALUES(${id})`;
        await tx`INSERT INTO public.user_roles(user_id,role) VALUES(${id},${role})`;
        if(country) await tx`INSERT INTO public.editor_countries VALUES(${id},${country})`;
        await tx`INSERT INTO public.editor_permissions VALUES(${id},'noticias',true,true,false,false)`;
      }
      const [n]=await tx`INSERT INTO public.news(title,content,content_blocks,created_by,country_code,published) VALUES('Spanish original','9.467','[]',${fr},'fr',true) RETURNING id`;
      const [other]=await tx`INSERT INTO public.news(title,created_by,country_code) VALUES('Other',${pt},'pt') RETURNING id`;
      const as=async (id:string|null)=>{ await tx.unsafe("RESET ROLE"); await tx`SELECT set_config('request.jwt.claim.sub',${id??""},true)`; await tx.unsafe(id?"SET LOCAL ROLE authenticated":"SET LOCAL ROLE anon"); };
      const deny=async(f:()=>Promise<unknown>)=>{ let denied=false; try{await tx.savepoint(async()=>{await f();});}catch{denied=true;} expect(denied).toBe(true);checks++; };
      await as(fr);
      await deny(()=>tx`INSERT INTO public.news_translations(news_id,status,approved_by,approved_at) VALUES(${n.id},'approved',${fr},now())`);
      await deny(()=>tx`INSERT INTO public.news_translations(news_id) VALUES(${other.id})`);
      const [tr]=await tx`INSERT INTO public.news_translations(news_id,title,source_hash) VALUES(${n.id},'English draft','hash') RETURNING *`;
      expect(tr.status).toBe('draft');checks++;
      await as(null);expect((await tx`SELECT * FROM public.news_translations`).length).toBe(0);checks++;
      await as(pt);expect((await tx`SELECT * FROM public.news_translations WHERE id=${tr.id}`).length).toBe(0);checks++;
      expect((await tx`UPDATE public.news_translations SET title='Forbidden' WHERE id=${tr.id} RETURNING id`).length).toBe(0);checks++;
      await as(fr);await deny(()=>tx`UPDATE public.news_translations SET news_id=${other.id} WHERE id=${tr.id}`);
      await deny(()=>tx`UPDATE public.news_translations SET status='approved',approved_by=${fr},approved_at=now() WHERE id=${tr.id}`);
      await as(admin);await tx`UPDATE public.news_translations SET status='approved',approved_by=${admin},approved_at=now() WHERE id=${tr.id}`;
      await as(null);expect((await tx`SELECT title FROM public.news_translations`)[0].title).toBe('English draft');checks++;
      await as(fr);const [edited]=await tx`UPDATE public.news_translations SET title='Reviewed edit',news_id=${n.id},lang='en' WHERE id=${tr.id} RETURNING *`;
      expect(edited.status).toBe('pending');checks++;expect(edited.approved_by).toBeNull();checks++;
      await as(admin);expect((await tx`SELECT snapshot FROM public.news_translation_revisions`)[0].snapshot.title).toBe('English draft');checks++;
      await tx`UPDATE public.news_translations SET status='approved',approved_by=${admin},approved_at=now() WHERE id=${tr.id}`;
      await tx`UPDATE public.news SET content='9.468' WHERE id=${n.id}`;
      const [stale]=await tx`SELECT * FROM public.news_translations WHERE id=${tr.id}`;expect(stale.status).toBe('pending');checks++;expect(stale.source_hash).toBeNull();checks++;
      await deny(()=>tx`UPDATE public.news_translations SET status='approved',approved_by=${admin},approved_at=now() WHERE id=${tr.id}`);
      await tx`UPDATE public.profiles SET suspended_at=now() WHERE user_id=${fr}`;
      await as(fr);expect((await tx`SELECT * FROM public.news_translations`).length).toBe(0);checks++;
      await deny(()=>tx`INSERT INTO public.news_translations(news_id) VALUES(${n.id})`);
      await tx.unsafe('RESET ROLE');
      await tx.unsafe(readFileSync('.lovable/safeguards/es-en-rules-rollback.sql','utf8'));
      expect((await tx`SELECT title FROM public.news_translations WHERE id=${tr.id}`)[0].title).toBe('Reviewed edit');checks++;
      expect((await tx`SELECT count(*)::int AS n FROM public.news_translation_revisions`)[0].n).toBe(2);checks++;
      throw new Error('EXPECTED_ROLLBACK');
    });
  } catch(e) { if(!(e instanceof Error)||e.message!=='EXPECTED_ROLLBACK') throw e; }
  expect((await sql`SELECT count(*)::int AS n FROM public.news_translations`)[0].n).toBe(0);
  expect((await sql`SELECT to_regclass('public.news_translation_revisions') AS name`)[0].name).toBeNull();
  console.log(`${checks+2} isolated database checks passed; changes rolled back`);
  await sql.end();
});