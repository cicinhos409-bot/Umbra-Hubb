import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const WEBHOOK_SECRET = Deno.env.get('CAKTO_WEBHOOK_SECRET') ?? ''
const CAKTO_PRODUCT_ID = '3dko6xr_769683'

// ── HMAC-SHA256 verification ──────────────────────────────────────────────────
async function verifyHmac(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['sign']
    )
    const raw = await crypto.subtle.sign('HMAC', key, enc.encode(body))
    const expected = Array.from(new Uint8Array(raw))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Timing-safe comparison
    if (expected.length !== signature.replace(/^sha256=/, '').length) return false
    const sig = signature.replace(/^sha256=/, '')
    let diff = 0
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
    }
    return diff === 0
  } catch (e) {
    console.error('[CAKTO] HMAC error:', e)
    return false
  }
}

// ── Secure license key generator ──────────────────────────────────────────────
// Format: UMBRA-XXXX-XXXX-XXXX-XXXX (4 groups of 4, excluding ambiguous chars)
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const groups: string[] = []
  for (let g = 0; g < 4; g++) {
    let group = ''
    for (let i = 0; i < 4; i++) {
      group += chars[bytes[g * 4 + i] % chars.length]
    }
    groups.push(group)
  }
  return 'UMBRA-' + groups.join('-')
}

// ── Normalize event names ──────────────────────────────────────────────────────
function classifyEvent(event: string): 'purchase' | 'cancellation' | 'unknown' {
  const e = (event || '').toLowerCase()
  if (['purchase_approved', 'purchase.approved', 'approved', 'order.approved',
    'compra_aprovada', 'payment_approved'].includes(e)) return 'purchase'
  if (['subscription_cancelled', 'subscription.canceled', 'subscription_canceled',
    'refund', 'refunded', 'chargeback'].includes(e)) return 'cancellation'
  return 'unknown'
}

// ── Log to pagamentos_log (table may not exist — fails silently) ──────────────
async function logPayment(record: Record<string, unknown>) {
  const { error } = await supabase.from('pagamentos_log').insert([{
    ...record,
    created_at: new Date().toISOString()
  }])
  if (error) console.warn('[CAKTO] pagamentos_log insert skipped:', error.message)
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const rawBody = await req.text()
  let payload: any

  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  console.log('[CAKTO] Webhook received at', new Date().toISOString())
  console.log('[CAKTO] Event:', payload.event)

  // ── Authentication ──────────────────────────────────────────────────────────
  if (WEBHOOK_SECRET) {
    const headerSig = req.headers.get('x-cakto-signature') || req.headers.get('x-signature')

    if (headerSig) {
      const valid = await verifyHmac(rawBody, headerSig, WEBHOOK_SECRET)
      if (!valid) {
        console.error('[CAKTO] Invalid HMAC signature')
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
      }
      console.log('[CAKTO] Auth OK (HMAC header)')
    } else if (payload.secret) {
      // Fallback: Cakto sends secret in body when HMAC not configured
      if (payload.secret !== WEBHOOK_SECRET) {
        console.error('[CAKTO] Invalid JSON secret')
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
      }
      console.log('[CAKTO] Auth OK (JSON secret)')
    } else {
      console.error('[CAKTO] No signature or secret provided')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
  } else {
    console.warn('[CAKTO] WARNING: CAKTO_WEBHOOK_SECRET not configured — auth disabled')
  }

  const { event, data } = payload
  const eventType = classifyEvent(event)

  // ── PURCHASE APPROVED ───────────────────────────────────────────────────────
  if (eventType === 'purchase') {
    const email: string = data?.customer?.email || data?.email || ''
    const productName: string = (data?.product?.name || data?.product_name || '').toLowerCase()
    const productId: string = data?.product?.id || ''
    const customerName: string = data?.customer?.name || data?.name || 'Cliente Umbra'
    const transactionId: string = data?.id || data?.transaction_id || 'N/A'
    const amount: number = data?.amount ?? 49.00

    console.log(`[CAKTO] Purchase → email=${email} | product="${productName}" | tx=${transactionId} | R$${amount}`)

    if (!email) {
      console.error('[CAKTO] CRITICAL: No email found in payload — purchase NOT processed')
      console.error('[CAKTO] Full payload:', JSON.stringify(payload))
      return new Response(JSON.stringify({ error: 'Email not found in payload' }), { status: 422 })
    }

    // Map product → tier
    const isPro =
      productName.includes('pro') ||
      productName.includes('umbra hub') ||
      productName.includes('turbo') ||
      productId === CAKTO_PRODUCT_ID

    if (!isPro) {
      console.warn(`[CAKTO] Product "${productName}" not mapped to PRO — no action taken`)
      return new Response(JSON.stringify({
        warning: `Product not mapped: "${productName}"`,
        tip: 'Expected product name to contain "pro", "umbra hub" or the product ID'
      }), { status: 200 })
    }

    const tier = 'PRO'
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // 1. Update user tier in profiles
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ tier, updated_at: new Date().toISOString() })
      .eq('email', email)

    if (profileErr) {
      console.error('[CAKTO] Profile update failed:', profileErr.message)
    } else {
      console.log(`[CAKTO] ✓ Tier → PRO for ${email}`)
    }

    // 2. Generate secure license key
    const chave = generateLicenseKey()

    const { error: licErr } = await supabase
      .from('licencas')
      .insert([{
        chave,
        usuario: customerName,
        email,
        status: 'ativa',
        plano: 'pro',
        max_dispositivos: 2,
        data_expiracao: expiresAt.toISOString(),
        extensao_slug: 'umbrahub-all'
      }])

    if (licErr) {
      console.error('[CAKTO] License insert failed:', licErr.message)
    } else {
      console.log(`[CAKTO] ✓ License: ${chave} | expires ${expiresAt.toISOString()}`)
    }

    // 3. Log payment event (optional table — fails silently)
    await logPayment({
      email,
      event,
      transaction_id: transactionId,
      amount,
      produto: productName,
      tier_atribuido: tier,
      licenca: chave
    })

    return new Response(JSON.stringify({
      success: true,
      message: 'Purchase processed',
      email,
      tier,
      licenca: chave,
      expires_at: expiresAt.toISOString()
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  // ── CANCELLATION / REFUND / CHARGEBACK ──────────────────────────────────────
  if (eventType === 'cancellation') {
    const email: string = data?.customer?.email || data?.email || ''
    const transactionId: string = data?.id || data?.transaction_id || 'N/A'

    console.log(`[CAKTO] Cancellation → email=${email} | reason=${event}`)

    if (!email) {
      console.error('[CAKTO] CRITICAL: No email found in cancellation payload')
      return new Response(JSON.stringify({ error: 'Email not found' }), { status: 422 })
    }

    // Revoke all active licenses
    const { error: licErr } = await supabase
      .from('licencas')
      .update({ status: 'expirada' })
      .eq('email', email)
      .eq('status', 'ativa')

    if (licErr) console.error('[CAKTO] License revoke failed:', licErr.message)
    else console.log(`[CAKTO] ✓ Licenses revoked for ${email}`)

    // Downgrade to FREE
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ tier: 'FREE', updated_at: new Date().toISOString() })
      .eq('email', email)

    if (profileErr) console.error('[CAKTO] Profile downgrade failed:', profileErr.message)
    else console.log(`[CAKTO] ✓ Tier → FREE for ${email}`)

    await logPayment({
      email,
      event,
      transaction_id: transactionId,
      amount: 0,
      motivo: event,
      tier_atribuido: 'FREE'
    })

    return new Response(JSON.stringify({
      success: true,
      message: 'Access revoked',
      email,
      reason: event
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  // ── UNHANDLED EVENT ──────────────────────────────────────────────────────────
  console.log(`[CAKTO] Unhandled event: "${event}" — acknowledging`)
  return new Response(JSON.stringify({
    message: 'Event acknowledged',
    event,
    handled: false
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})
