import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkResumeData() {
  // Get the most recent resume for David
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .ilike('original_filename', '%David%')
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) {
    console.error('Error:', error)
    return
  }

  data?.forEach((resume, idx) => {
    console.log(`\n========== RESUME ${idx + 1} ==========`)
    console.log('ID:', resume.id)
    console.log('Filename:', resume.original_filename)
    console.log('Created:', resume.created_at)
    console.log('Status:', resume.status)
    console.log('Parent ID:', resume.parent_resume_id)
    console.log('Version:', resume.version_name)
    console.log('\n--- Structured Data ---')
    if (resume.structured_data) {
      const sections = resume.structured_data.sections || []
      sections.forEach((section: any) => {
        console.log(`\nSection: ${section.heading} (${section.type})`)
        console.log(`  Content blocks: ${section.content.length}`)

        if (section.type === 'experience') {
          section.content.forEach((block: any) => {
            if (block.type === 'experience_item') {
              const exp = block.content
              console.log(`    - ${exp.jobTitle} at ${exp.company} (${exp.startDate} - ${exp.endDate})`)
            }
          })
        }

        if (section.type === 'skills') {
          console.log(`    Content:`, JSON.stringify(section.content, null, 2))
        }
      })
    }
  })
}

checkResumeData()
