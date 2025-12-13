-- Purge all resume and analysis data from the database
-- Execute this in the Supabase SQL Editor for a quick purge

-- ⚠️  WARNING: This will delete ALL data from the database!
-- This action cannot be undone.

BEGIN;

-- Delete in order of dependencies (child tables first)

-- 1. Delete resume-job matches
DELETE FROM resume_job_matches;

-- 2. Delete optimization history
DELETE FROM optimization_history;

-- 3. Delete usage tracking
DELETE FROM usage_tracking;

-- 4. Delete resumes
DELETE FROM resumes;

-- 5. Delete job descriptions
DELETE FROM job_descriptions;

COMMIT;

-- Verify deletion
SELECT
  'resumes' as table_name,
  COUNT(*) as row_count
FROM resumes

UNION ALL

SELECT
  'job_descriptions',
  COUNT(*)
FROM job_descriptions

UNION ALL

SELECT
  'resume_job_matches',
  COUNT(*)
FROM resume_job_matches

UNION ALL

SELECT
  'optimization_history',
  COUNT(*)
FROM optimization_history

UNION ALL

SELECT
  'usage_tracking',
  COUNT(*)
FROM usage_tracking;

-- All row_count values should be 0
