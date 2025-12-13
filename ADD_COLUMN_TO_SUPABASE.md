# Add optimized_json_data Column to Supabase

## Quick Fix

The app now works WITHOUT this column, but adding it will enable the professional template feature.

## How to Add the Column

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on **"Table Editor"** in the left sidebar
3. Select the **"resumes"** table
4. Click **"+ New Column"**
5. Configure:
   - **Name**: `optimized_json_data`
   - **Type**: `jsonb`
   - **Default value**: Leave empty
   - **Is nullable**: ✅ YES (checked)
   - **Is unique**: ❌ NO
   - **Is array**: ❌ NO
6. Click **"Save"**

### Option 2: Via SQL Editor

1. Go to **"SQL Editor"** in your Supabase dashboard
2. Click **"+ New query"**
3. Paste this SQL:

```sql
-- Add optimized_json_data column to resumes table
ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS optimized_json_data JSONB;

-- Add comment explaining what this column is for
COMMENT ON COLUMN resumes.optimized_json_data IS 'Clean JSON format from optimizer matching the Jinja template structure (full_name, contact, work_experience, etc.)';
```

4. Click **"Run"**

## Verify It Worked

Run this query to check if the column exists:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'resumes'
  AND column_name = 'optimized_json_data';
```

You should see:
```
column_name          | data_type | is_nullable
optimized_json_data  | jsonb     | YES
```

## What This Column Does

- Stores the clean JSON format from the optimizer
- Enables the professional Jinja-style Word template
- Format: `{ full_name, contact, work_experience, education, certifications, projects }`
- Used when downloading optimized resumes as DOCX

## Without This Column

- App still works! ✅
- Downloads use legacy generator (basic formatting)
- No professional template features

## With This Column

- Professional DOCX templates! ✨
- Clean formatting with proper headers, bullets, spacing
- Consistent with standalone scripts
- Better user experience
