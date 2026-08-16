import { createServerFn } from '@tanstack/react-start'
import {
  newsletterInput,
  newsletterTokenInput,
  contributorInput,
  communityInput,
  guardPublicForm,
} from './public-forms.server'
import {
  CONFIRM_TTL_HOURS,
  hashToken,
  newToken,
  sameHash,
  sendNewsletterConfirmation,
} from '@/lib/newsletter/newsletter.server'
import {
  NEWSLETTER_CONSENT_TEXT,
  NEWSLETTER_CONSENT_VERSION,
} from '@/lib/newsletter/consent-text'

/**
 * Alta en la newsletter con doble opt-in.
 * Siempre queda en estado "pending" hasta que se confirma el enlace del email.
 * Una re-suscripción tras una baja exige aceptar de nuevo y volver a confirmar.
 */
export const subscribeNewsletter = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => newsletterInput.parse(input))
  .handler(async ({ data }) => {
    const guard = await guardPublicForm('newsletter', data.turnstileToken, {
      max: 5,
      windowSeconds: 600,
    })
    if (!guard.ok) return { ok: false as const, error: guard.error }

    const email = data.email.toLowerCase()
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const { data: existing } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('email', email)
      .maybeSingle()

    if (existing?.status === 'active') {
      return { ok: false as const, error: 'duplicate' }
    }

    const token = newToken()
    const now = new Date()
    const record = {
      email,
      source: data.source ?? 'footer',
      status: 'pending',
      consent_at: now.toISOString(),
      consent_version: NEWSLETTER_CONSENT_VERSION,
      consent_text: NEWSLETTER_CONSENT_TEXT,
      confirmed_at: null,
      unsubscribed_at: null,
      confirm_token_hash: hashToken(token),
      confirm_token_expires_at: new Date(
        now.getTime() + CONFIRM_TTL_HOURS * 3600 * 1000,
      ).toISOString(),
      confirm_sent_at: now.toISOString(),
      unsubscribe_token_hash: null,
    }

    const { error } = existing
      ? await supabaseAdmin
          .from('newsletter_subscribers')
          .update(record)
          .eq('id', existing.id)
      : await supabaseAdmin.from('newsletter_subscribers').insert(record)

    if (error) {
      if (error.code === '23505') return { ok: false as const, error: 'duplicate' }
      return { ok: false as const, error: 'generic' }
    }

    const mail = await sendNewsletterConfirmation(email, token)
    return { ok: true as const, pending: true as const, mailSent: mail.sent }
  })

/** Confirma el doble opt-in con el token del email. */
export const confirmNewsletter = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => newsletterTokenInput.parse(input))
  .handler(async ({ data }) => {
    const guard = await guardPublicForm('newsletter_confirm', null, {
      max: 20,
      windowSeconds: 600,
    })
    if (!guard.ok) return { ok: false as const, error: 'rate_limited' }

    const tokenHash = hashToken(data.token)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: row } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('id, status, confirm_token_hash, confirm_token_expires_at')
      .eq('confirm_token_hash', tokenHash)
      .maybeSingle()

    if (!row || !sameHash(row.confirm_token_hash, tokenHash)) {
      return { ok: false as const, error: 'invalid' }
    }
    if (row.confirm_token_expires_at && new Date(row.confirm_token_expires_at) < new Date()) {
      return { ok: false as const, error: 'expired' }
    }
    if (row.status === 'unsubscribed') {
      return { ok: false as const, error: 'invalid' }
    }

    const unsubToken = newToken()
    const { error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .update({
        status: 'active',
        confirmed_at: new Date().toISOString(),
        // El token de confirmación se consume: no puede reutilizarse.
        confirm_token_hash: null,
        confirm_token_expires_at: null,
        unsubscribe_token_hash: hashToken(unsubToken),
      })
      .eq('id', row.id)

    if (error) return { ok: false as const, error: 'generic' }
    return { ok: true as const, unsubscribeToken: unsubToken }
  })

/** Baja inmediata sin iniciar sesión, mediante el token del enlace del email. */
export const unsubscribeNewsletter = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => newsletterTokenInput.parse(input))
  .handler(async ({ data }) => {
    const guard = await guardPublicForm('newsletter_unsubscribe', null, {
      max: 20,
      windowSeconds: 600,
    })
    if (!guard.ok) return { ok: false as const, error: 'rate_limited' }

    const tokenHash = hashToken(data.token)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: row } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('id, status, unsubscribe_token_hash')
      .eq('unsubscribe_token_hash', tokenHash)
      .maybeSingle()

    if (!row || !sameHash(row.unsubscribe_token_hash, tokenHash)) {
      return { ok: false as const, error: 'invalid' }
    }
    if (row.status === 'unsubscribed') {
      return { ok: true as const, alreadyUnsubscribed: true as const }
    }

    const { error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
        confirm_token_hash: null,
        confirm_token_expires_at: null,
      })
      .eq('id', row.id)

    if (error) return { ok: false as const, error: 'generic' }
    return { ok: true as const, alreadyUnsubscribed: false as const }
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
