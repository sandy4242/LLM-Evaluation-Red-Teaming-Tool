import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET a single prompt with all its versions
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { data: prompt, error: promptError } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', id)
    .single()

  if (promptError || !prompt) {
    return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
  }

  const { data: versions } = await supabase
    .from('prompt_versions')
    .select('*')
    .eq('prompt_id', id)
    .order('version_no', { ascending: false })

  return NextResponse.json({ ...prompt, versions: versions ?? [] })
}

// PUT edit a prompt — creates a new version, preserves old results
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, system_prompt, variables } = await req.json()

    // Get latest version number
    const { data: latestVersion } = await supabase
      .from('prompt_versions')
      .select('version_no')
      .eq('prompt_id', id)
      .order('version_no', { ascending: false })
      .limit(1)
      .single()

    const nextVersionNo = (latestVersion?.version_no ?? 0) + 1

    // Update the prompt
    const { data: updatedPrompt, error: updateError } = await supabase
      .from('prompts')
      .update({
        ...(name && { name }),
        ...(system_prompt && { system_prompt }),
        ...(variables && { variables })
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError || !updatedPrompt) {
      return NextResponse.json({ error: updateError?.message }, { status: 500 })
    }

    // Create new version if system_prompt changed
    if (system_prompt) {
      const { error: versionError } = await supabase
        .from('prompt_versions')
        .insert({
          prompt_id: id,
          version_no: nextVersionNo,
          system_prompt
        })

      if (versionError) {
        return NextResponse.json({ error: versionError.message }, { status: 500 })
      }
    }

    return NextResponse.json(updatedPrompt)
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500 }
    )
  }
}