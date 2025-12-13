/**
 * Purge all resume and analysis data from the database
 * Use this to clear the database for fresh testing
 */

import { createClient } from '@supabase/supabase-js'

async function purgeAllData() {
  console.log('='.repeat(80))
  console.log('PURGING ALL DATA FROM DATABASE')
  console.log('='.repeat(80))
  console.log('\n⚠️  WARNING: This will delete ALL data from the database!')
  console.log('This action cannot be undone.\n')

  // Initialize Supabase client with service role key for admin access
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERROR: Missing Supabase credentials')
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Delete in order of dependencies (child tables first)

    console.log('\n[1/5] Deleting resume-job matches...')
    const { error: matchesError, count: matchesCount } = await supabase
      .from('resume_job_matches')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

    if (matchesError) {
      console.error('❌ Error deleting resume_job_matches:', matchesError.message)
    } else {
      console.log(`✓ Deleted ${matchesCount || 0} resume-job matches`)
    }

    console.log('\n[2/5] Deleting optimization history...')
    const { error: historyError, count: historyCount } = await supabase
      .from('optimization_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (historyError) {
      console.error('❌ Error deleting optimization_history:', historyError.message)
    } else {
      console.log(`✓ Deleted ${historyCount || 0} optimization history records`)
    }

    console.log('\n[3/5] Deleting usage tracking...')
    const { error: usageError, count: usageCount } = await supabase
      .from('usage_tracking')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (usageError) {
      console.error('❌ Error deleting usage_tracking:', usageError.message)
    } else {
      console.log(`✓ Deleted ${usageCount || 0} usage tracking records`)
    }

    console.log('\n[4/5] Deleting resumes...')
    const { error: resumesError, count: resumesCount } = await supabase
      .from('resumes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (resumesError) {
      console.error('❌ Error deleting resumes:', resumesError.message)
    } else {
      console.log(`✓ Deleted ${resumesCount || 0} resumes`)
    }

    console.log('\n[5/5] Deleting job descriptions...')
    const { error: jobsError, count: jobsCount } = await supabase
      .from('job_descriptions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (jobsError) {
      console.error('❌ Error deleting job_descriptions:', jobsError.message)
    } else {
      console.log(`✓ Deleted ${jobsCount || 0} job descriptions`)
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ DATABASE PURGE COMPLETE')
    console.log('='.repeat(80))
    console.log('\nThe database is now empty and ready for fresh testing.')
    console.log('You can now upload resumes and test the optimization flow.\n')

  } catch (error) {
    console.error('\n❌ PURGE FAILED:', error)
    process.exit(1)
  }
}

// Run the purge
purgeAllData().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
