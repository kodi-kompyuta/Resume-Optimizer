-- Add optimization_context column to resume_job_matches table
-- This stores strategic context for optimizer including prioritized gaps, keywords, and guidance

ALTER TABLE resume_job_matches
ADD COLUMN IF NOT EXISTS optimization_context JSONB;

COMMENT ON COLUMN resume_job_matches.optimization_context IS
  'Strategic optimization context including prioritized gaps, high-value keywords, section priorities, and optimization guidance for comprehensive single-pass optimization';

-- Update existing gaps to have default priorities and impact points
UPDATE resume_job_matches
SET gaps = (
  SELECT jsonb_agg(
    gap || jsonb_build_object(
      'optimization_priority',
      CASE
        WHEN gap->>'severity' = 'critical' THEN 10
        WHEN gap->>'severity' = 'important' THEN 7
        WHEN gap->>'severity' = 'nice-to-have' THEN 3
        ELSE 5
      END,
      'impact_points',
      CASE
        WHEN gap->>'severity' = 'critical' THEN 8
        WHEN gap->>'severity' = 'important' THEN 5
        WHEN gap->>'severity' = 'nice-to-have' THEN 2
        ELSE 3
      END
    )
  )
  FROM jsonb_array_elements(gaps) gap
)
WHERE gaps IS NOT NULL AND jsonb_array_length(gaps) > 0;

-- Update existing recommended_additions to have default impact points
UPDATE resume_job_matches
SET recommended_additions = (
  SELECT jsonb_agg(
    addition || jsonb_build_object(
      'impact_points',
      CASE
        WHEN addition->>'priority' = 'high' THEN 7
        WHEN addition->>'priority' = 'medium' THEN 4
        WHEN addition->>'priority' = 'low' THEN 2
        ELSE 3
      END
    )
  )
  FROM jsonb_array_elements(recommended_additions) addition
)
WHERE recommended_additions IS NOT NULL AND jsonb_array_length(recommended_additions) > 0;
