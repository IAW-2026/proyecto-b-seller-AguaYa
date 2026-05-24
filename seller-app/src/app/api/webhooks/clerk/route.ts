import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    return new Response('Webhook secret not configured', { status: 500 })
  }

  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent
  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch {
    return new Response('Invalid webhook signature', { status: 400 })
  }

  if (evt.type === 'user.created') {
    const { id, public_metadata } = evt.data
    console.log(`[webhook] user.created: ${id}, metadata:`, public_metadata)

    const metadata = public_metadata as Record<string, unknown> | undefined
    const roles: string[] = Array.isArray(metadata?.roles) ? metadata.roles : []

    if (!roles.includes('seller')) {
      try {
        const client = await clerkClient()
        await client.users.updateUser(id, {
          publicMetadata: {
            ...metadata,
            roles: [...roles, 'seller'],
          },
        })
        console.log(`[webhook] assigned role seller to user ${id}`)
      } catch (error) {
        console.error(`[webhook] failed to update user ${id}:`, error)
        return new Response('Failed to update user', { status: 500 })
      }
    } else {
      console.log(`[webhook] user ${id} already has seller role`)
    }
  }

  return new Response('OK', { status: 200 })
}
