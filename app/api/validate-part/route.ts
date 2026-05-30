import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const ValidateSchema = z.object({
  partSourceId: z.string().uuid(),
  vehicleBrand: z.string().min(1).max(100),
  vehicleModel: z.string().min(1).max(100),
  vehicleYear:  z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1),
  notes:        z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  // Get authenticated user (uses anon key + cookies)
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Debés iniciar sesión para validar' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = ValidateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { partSourceId, vehicleBrand, vehicleModel, vehicleYear, notes } = parsed.data
  const supabase = createServiceClient()

  // Prevent duplicate validations per user per part
  const { data: existing } = await supabase
    .from('part_validations')
    .select('id')
    .eq('user_id', user.id)
    .eq('part_source_id', partSourceId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Ya validaste este repuesto' }, { status: 409 })
  }

  const { error } = await supabase.from('part_validations').insert({
    user_id:       user.id,
    part_source_id: partSourceId,
    vehicle_brand: vehicleBrand,
    vehicle_model: vehicleModel,
    vehicle_year:  vehicleYear,
    notes,
    validated_at:  new Date().toISOString(),
  })

  if (error) {
    console.error('[validate-part]', error)
    return NextResponse.json({ error: 'Error al guardar la validación' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
