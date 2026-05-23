import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET all prompts
export async function GET() {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST create a new prompt (also creates version 1)
export async function POST(req: NextRequest) {
  try {
    const { name, system_prompt, variables } = await req.json()

    if (!name || !system_prompt) {
      return NextResponse.json(
        { error: 'name and system_prompt are required' },
        { status: 400 }
      )
    }

    // Create the prompt
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .insert({ name, system_prompt, variables: variables ?? [] })
      .select()
      .single()

    if (promptError || !prompt) {
      return NextResponse.json({ error: promptError?.message }, { status: 500 })
    }

    // Auto-create version 1
    const { error: versionError } = await supabase
      .from('prompt_versions')
      .insert({
        prompt_id: prompt.id,
        version_no: 1,
        system_prompt
      })

    if (versionError) {
      return NextResponse.json({ error: versionError.message }, { status: 500 })
    }

    return NextResponse.json(prompt, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500 }
    )
  }
}