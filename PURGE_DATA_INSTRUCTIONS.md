# How to Purge All Resume Data

This guide provides **3 methods** to completely clear all resume and analysis data from the database for fresh testing.

---

## ⚠️ WARNING

**This will delete ALL data including:**
- All uploaded resumes
- All optimization history
- All job descriptions
- All resume-job matches
- All usage tracking data

**This action CANNOT be undone!**

---

## Method 1: Using TypeScript Script (Recommended)

This method uses a TypeScript script that safely deletes data in the correct order.

### Steps:

1. **Ensure you have the service role key**:
   Add this to your `.env.local` file if not already present:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

   You can find this in your Supabase dashboard:
   - Go to Project Settings → API
   - Copy the "service_role" secret key

2. **Run the purge script**:
   ```bash
   npx tsx scripts/purge-data.ts
   ```

3. **Verify deletion**:
   The script will show you how many records were deleted from each table.

### Expected Output:
```
================================================================================
PURGING ALL DATA FROM DATABASE
================================================================================

⚠️  WARNING: This will delete ALL data from the database!
This action cannot be undone.

[1/5] Deleting resume-job matches...
✓ Deleted 5 resume-job matches

[2/5] Deleting optimization history...
✓ Deleted 3 optimization history records

[3/5] Deleting usage tracking...
✓ Deleted 10 usage tracking records

[4/5] Deleting resumes...
✓ Deleted 8 resumes

[5/5] Deleting job descriptions...
✓ Deleted 2 job descriptions

================================================================================
✅ DATABASE PURGE COMPLETE
================================================================================

The database is now empty and ready for fresh testing.
```

---

## Method 2: Using Supabase SQL Editor (Quick & Easy)

This method executes SQL directly in the Supabase dashboard.

### Steps:

1. **Open Supabase Dashboard**:
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Open SQL Editor**:
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and paste this SQL**:
   ```sql
   -- Delete in order of dependencies
   DELETE FROM resume_job_matches;
   DELETE FROM optimization_history;
   DELETE FROM usage_tracking;
   DELETE FROM resumes;
   DELETE FROM job_descriptions;
   ```

4. **Run the query**:
   - Click "Run" or press `Ctrl+Enter`

5. **Verify deletion**:
   Run this query to check all tables are empty:
   ```sql
   SELECT
     'resumes' as table_name,
     COUNT(*) as row_count
   FROM resumes

   UNION ALL
   SELECT 'job_descriptions', COUNT(*) FROM job_descriptions
   UNION ALL
   SELECT 'resume_job_matches', COUNT(*) FROM resume_job_matches
   UNION ALL
   SELECT 'optimization_history', COUNT(*) FROM optimization_history
   UNION ALL
   SELECT 'usage_tracking', COUNT(*) FROM usage_tracking;
   ```

   All `row_count` values should be `0`.

### Or Use the Pre-made SQL File:

You can also copy the contents of `scripts/purge-data.sql` and paste it into the SQL Editor.

---

## Method 3: Using Supabase Table Editor (Manual)

If you prefer a visual approach, you can delete data manually from each table.

### Steps:

1. **Open Supabase Dashboard** → **Table Editor**

2. **Delete data from these tables in order**:
   1. `resume_job_matches` - Click table → "Delete all rows"
   2. `optimization_history` - Click table → "Delete all rows"
   3. `usage_tracking` - Click table → "Delete all rows"
   4. `resumes` - Click table → "Delete all rows"
   5. `job_descriptions` - Click table → "Delete all rows"

3. **Verify** each table shows "No rows" in the table view

---

## After Purging

Once the data is purged:

1. ✅ All tables are empty
2. ✅ Database schema remains intact
3. ✅ You can immediately upload new resumes
4. ✅ Ready for fresh testing

### Test Fresh Upload:

```bash
# Start the dev server
npm run dev

# Navigate to http://localhost:3000/upload
# Upload your resume
# Verify parsing works correctly
```

---

## Troubleshooting

### Error: "Missing Supabase credentials"

**Solution**: Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`

### Error: "Foreign key constraint violation"

**Solution**: Delete tables in the correct order (child tables first):
1. resume_job_matches
2. optimization_history
3. usage_tracking
4. resumes
5. job_descriptions

### Error: "Permission denied"

**Solution**: Use the service role key, not the anon key. The service role key has full database access.

---

## Quick Reference

| Method | Speed | Ease of Use | Recommended For |
|--------|-------|-------------|-----------------|
| TypeScript Script | Fast | Medium | Developers, automated testing |
| SQL Editor | Fastest | Easy | Quick one-time purge |
| Table Editor | Slow | Easiest | Visual learners, manual control |

**Recommendation**: Use **Method 2 (SQL Editor)** for the quickest purge!

---

## Files Created

- `scripts/purge-data.ts` - TypeScript purge script
- `scripts/purge-data.sql` - SQL purge script
- `PURGE_DATA_INSTRUCTIONS.md` - This file

---

**Ready to purge?** Choose your method and follow the steps above! 🚀
