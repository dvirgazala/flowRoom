import { supabase } from './supabase'
import type { RegistrationBody } from './types'

export type RuleKind = 'body_meta' | 'form_field' | 'rate' | 'deadline'

export interface RegulatoryRule {
  id: string
  body: string
  kind: RuleKind
  label: string | null
  content_json: Record<string, unknown>
  effective_from: string | null
  effective_until: string | null
  source_url: string | null
  last_verified_at: string
  verified_by: string
  version: number
  supersedes_id: string | null
  created_at: string
  updated_at: string
}

export interface BodyMeta {
  label: string
  short: string
  url: string
  color: string
  tint: string
  ring: string
  blurb: string
  relevantSplit: 'publishing' | 'master' | 'both'
  // DB-only fields — undefined when using fallback
  lastVerifiedAt?: string
  verifiedBy?: string
  version?: number
  ruleId?: string
  sourceUrl?: string
}

// Hardcoded fallback — used if regulatory_rules table doesn't exist or returns nothing.
// This is the single authoritative source until the DB is set up.
// last_verified_at for fallback = date this code was last audited.
export const BODIES_FALLBACK: Record<RegistrationBody, BodyMeta> = {
  acum: {
    label: 'אקו"ם', short: 'ACUM', url: 'https://www.acum.org.il/',
    color: 'text-purple', tint: 'bg-purple/10', ring: 'border-purple/30',
    blurb: 'תמלוגי ביצוע ציבורי ושכפול — למלחינים ופזמונאים. כל שיר שיוצא חייב להיות רשום.',
    relevantSplit: 'publishing',
    lastVerifiedAt: '2026-04-18', verifiedBy: 'FlowRoom Team', version: 1,
  },
  pil: {
    label: 'הפיל', short: 'PIL', url: 'https://www.pil.org.il/',
    color: 'text-pink', tint: 'bg-pink/10', ring: 'border-pink/30',
    blurb: 'הפדרציה לתקליטים — מייצגת מפיקים ובעלי מאסטר מול רדיו, פלאיליסטים, אירועים.',
    relevantSplit: 'master',
    lastVerifiedAt: '2026-04-18', verifiedBy: 'FlowRoom Team', version: 1,
  },
  eshkolot: {
    label: 'אשכולות', short: 'Eshkolot', url: 'https://eshkolot.com/',
    color: 'text-warning', tint: 'bg-warning/10', ring: 'border-warning/30',
    blurb: 'אמנים מבצעים — גובה זכויות שכנות (neighboring rights) לזמרים ולנגנים.',
    relevantSplit: 'master',
    lastVerifiedAt: '2026-04-18', verifiedBy: 'FlowRoom Team', version: 1,
  },
  distributor: {
    label: 'דיסטריביוטור', short: 'DistroKid', url: 'https://distrokid.com/',
    color: 'text-info', tint: 'bg-info/10', ring: 'border-info/30',
    blurb: 'הפצה דיגיטלית לספוטיפיי, אפל מיוזיק, יוטיוב מיוזיק, טיקטוק — סטרימינג גלובלי.',
    relevantSplit: 'both',
    lastVerifiedAt: '2026-04-18', verifiedBy: 'FlowRoom Team', version: 1,
  },
  'youtube-cid': {
    label: 'YouTube Content ID', short: 'CID', url: 'https://studio.youtube.com/',
    color: 'text-danger', tint: 'bg-danger/10', ring: 'border-danger/30',
    blurb: 'זיהוי אוטומטי של השיר שלך ביוטיוב — מייצר הכנסה כשאחרים משתמשים בשיר בוידאו.',
    relevantSplit: 'master',
    lastVerifiedAt: '2026-04-18', verifiedBy: 'FlowRoom Team', version: 1,
  },
}

export const BODY_ORDER_CONST: RegistrationBody[] = ['acum', 'pil', 'eshkolot', 'distributor', 'youtube-cid']

// How many days before a rule is considered "stale" and needs re-verification.
export const STALE_THRESHOLD_DAYS = 30

export function isStale(lastVerifiedAt: string): boolean {
  const diff = Date.now() - new Date(lastVerifiedAt).getTime()
  return diff > STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
}

export function formatVerifiedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

// ── Fetch helpers ──────────────────────────────────────────────────────────

export async function fetchBodiesMeta(): Promise<Record<RegistrationBody, BodyMeta>> {
  try {
    const { data, error } = await supabase
      .from('regulatory_rules')
      .select('*')
      .eq('kind', 'body_meta')
      .is('effective_until', null)
      .order('version', { ascending: false })

    if (error || !data || data.length === 0) return BODIES_FALLBACK

    const result: Record<RegistrationBody, BodyMeta> = { ...BODIES_FALLBACK }
    const seen = new Set<string>()

    for (const row of data as RegulatoryRule[]) {
      if (seen.has(row.body)) continue
      seen.add(row.body)
      if (!BODY_ORDER_CONST.includes(row.body as RegistrationBody)) continue

      const j = row.content_json as Record<string, string>
      result[row.body as RegistrationBody] = {
        label:          row.label ?? j.label ?? row.body,
        short:          j.short ?? row.body,
        url:            row.source_url ?? j.url ?? '',
        color:          j.color ?? 'text-text-primary',
        tint:           j.tint ?? 'bg-bg3',
        ring:           j.ring ?? 'border-border',
        blurb:          j.blurb ?? '',
        relevantSplit:  (j.relevantSplit as 'publishing' | 'master' | 'both') ?? 'both',
        lastVerifiedAt: row.last_verified_at,
        verifiedBy:     row.verified_by,
        version:        row.version,
        ruleId:         row.id,
        sourceUrl:      row.source_url ?? undefined,
      }
    }
    return result
  } catch {
    return BODIES_FALLBACK
  }
}

export async function fetchAllRules(): Promise<RegulatoryRule[]> {
  try {
    const { data, error } = await supabase
      .from('regulatory_rules')
      .select('*')
      .order('body')
      .order('kind')
      .order('version', { ascending: false })
    if (error || !data) return []
    return data as RegulatoryRule[]
  } catch {
    return []
  }
}

export async function verifyRule(id: string, verifiedBy: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('regulatory_rules')
      .update({
        last_verified_at: new Date().toISOString(),
        verified_by:      verifiedBy,
        updated_at:       new Date().toISOString(),
      })
      .eq('id', id)
    return !error
  } catch {
    return false
  }
}

export async function updateRuleField(
  id: string,
  patch: { label?: string; source_url?: string; content_json?: Record<string, unknown>; verified_by?: string },
): Promise<boolean> {
  try {
    const { data: current } = await supabase
      .from('regulatory_rules').select('version').eq('id', id).single()
    const { error } = await supabase
      .from('regulatory_rules')
      .update({
        ...patch,
        version:          (current?.version ?? 1) + 1,
        last_verified_at: new Date().toISOString(),
        updated_at:       new Date().toISOString(),
      })
      .eq('id', id)
    return !error
  } catch {
    return false
  }
}

export async function tableExists(): Promise<boolean> {
  try {
    const { error } = await supabase.from('regulatory_rules').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}
