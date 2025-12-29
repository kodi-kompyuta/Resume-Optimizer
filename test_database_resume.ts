import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables manually
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  const envContent = fs.readFileSync(envPath, 'utf-8')

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      const value = valueParts.join('=').trim()
      process.env[key.trim()] = value
    }
  })
}

loadEnv()

async function testDatabaseResume() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('FETCHING ALL RESUMES FROM DATABASE:')
  console.log('='.repeat(80))

  // Fetch all resumes (most recent first)
  const { data: resumes, error } = await supabase
    .from('resumes')
    .select('id, original_filename, parent_resume_id, created_at, structured_data')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching resumes:', error)
    return
  }

  for (const resume of resumes || []) {
    console.log(`\nResume: ${resume.original_filename}`)
    console.log(`  ID: ${resume.id}`)
    console.log(`  Is Optimized: ${!!resume.parent_resume_id}`)
    console.log(`  Created: ${resume.created_at}`)

    if (resume.structured_data) {
      const structured = resume.structured_data as any

      const expSection = structured.sections?.find((s: any) => s.type === 'experience')
      const jobs = expSection?.content?.filter((b: any) => b.type === 'experience_item') || []

      console.log(`  Jobs in structured_data: ${jobs.length}`)

      jobs.forEach((job: any, idx: number) => {
        const exp = job.content
        console.log(`    Job ${idx + 1}: "${exp.jobTitle}"`)
        console.log(`      Company: "${exp.company || '(empty)'}"`)
        console.log(`      Location: "${exp.location || '(empty)'}"`)
        console.log(`      Dates: ${exp.startDate || '(empty)'} - ${exp.endDate || '(empty)'}`)
        console.log(`      Achievements: ${exp.achievements?.length || 0}`)
      })

      const certSection = structured.sections?.find((s: any) => s.type === 'certifications')
      const certs = certSection?.content?.filter((b: any) => b.type === 'certification_item') || []
      console.log(`  Certifications: ${certs.length}`)

    } else {
      console.log(`  No structured_data in database`)
    }
    console.log('-'.repeat(80))
  }
}

testDatabaseResume().catch(console.error)
