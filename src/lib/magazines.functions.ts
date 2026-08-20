import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { listPublicMagazinePages } from './magazines.server'

export const getMagazinePages = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => listPublicMagazinePages(data.id))
