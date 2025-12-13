-- Add optimized_json_data column to resumes table
-- This stores the clean JSON format from the optimizer for use with the professional template

ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS optimized_json_data JSONB;

COMMENT ON COLUMN resumes.optimized_json_data IS 'Clean JSON format from optimizer matching the Jinja template structure (full_name, contact, work_experience, etc.)';
