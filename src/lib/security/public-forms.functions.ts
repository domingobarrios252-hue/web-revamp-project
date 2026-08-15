import { createServerFn } from '@tanstack/react-start'
import {
  newsletterInput,
  contributorInput,
  communityInput,
  guardPublicForm,
} from './public-forms.server'

export const subscribeNewsletter = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => newsletterInput.parse(input))
  .handler(async ({ data }) => {
    const guard = await guardPublicForm('newsletter', data.turnstileToken, {
      max: 5,
      windowSeconds: 600,
    })
    if (!guard.ok) return { ok: false as const, error: guard.error }

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .insert({ email: data.email.toLowerCase(), source: data.source ?? 'footer' })

    if (error) {
      if (error.code === '23505') return { ok: false as const, error: 'duplicate' }
      return { ok: false as const, error: 'generic' }
    }
    return { ok: true as const }
  })

export const submitContributorSignup = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => contributorInput.parse(input))
  .handler(async ({ data }) => {
    const guard = await guardPublicForm('contributor_signup', data.turnstileToken, {
      max: 3,
      windowSeconds: 900,
    })
    if (!guard.ok) return { ok: false as const, error: guard.error }

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { error } = await supabaseAdmin.from('contributor_signups').insert({
      full_name: data.full_name,
      email: data.email,
      country: data.country,
      region: data.region || null,
      club_or_federation: data.club_or_federation || null,
      topics: data.topics,
      role_type: data.role_type,
      message: data.message || null,
      language: 'es',
      status: 'nuevo',
    })

    if (error) return { ok: false as const, error: 'No se ha podido enviar. Inténtalo más tarde.' }
    return { ok: true as const }
  })

export const submitCommunitySubmission = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => communityInput.parse(input))
  .handler(async ({ data }) => {
    const guard = await guardPublicForm('community_submission', data.turnstileToken, {
      max: 3,
      windowSeconds: 900,
    })
    if (!guard.ok) return { ok: false as const, error: guard.error }

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { error } = await supabaseAdmin.from('community_submissions').insert({
      submission_type: data.submission_type,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      title: data.title,
      description: data.description,
      country_code: data.country_code,
      image_urls: data.image_urls ?? [],
      links: [],
      status: 'pendiente',
    })

    if (error) return { ok: false as const, error: 'No se pudo enviar. Inténtalo más tarde.' }
    return { ok: true as const }
  })
