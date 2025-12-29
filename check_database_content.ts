import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ytkbmqwjvfzqbusbokqw.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  const { data, error } = await supabase
    .from('resumes')
    .select('id, original_filename, created_at, structured_data, optimized_json_data')
    .ilike('original_filename', '%David%')
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) {
    console.error('Error:', error)
    return
  }

  data?.forEach((resume, idx) => {
    console.log(`\n========== RESUME ${idx + 1}: ${resume.original_filename} ==========`)
    console.log('ID:', resume.id)
    console.log('Created:', resume.created_at)

    if (resume.structured_data?.sections) {
      const expSection = resume.structured_data.sections.find((s: any) => s.type === 'experience')
      const expItems = expSection?.content.filter((b: any) => b.type === 'experience_item') || []
      console.log(`\nWork Experience: ${expItems.length} jobs`)
      expItems.forEach((item: any, i: number) => {
        const exp = item.content
        console.log(`  ${i + 1}. ${exp.jobTitle} at ${exp.company} (${exp.startDate} - ${exp.endDate})`)
      })
    }

    if (resume.optimized_json_data) {
      console.log(`\nOptimized JSON Work Experience: ${resume.optimized_json_data.work_experience?.length || 0} jobs`)
      resume.optimized_json_data.work_experience?.forEach((exp: any, i: number) => {
        console.log(`  ${i + 1}. ${exp.job_title} at ${exp.company}`)
      })
    }
  })
}

checkData()
