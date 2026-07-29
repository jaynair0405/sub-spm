-- Migration: Add pdf_filename column to div_sub_spm_runs table
-- This column stores the filename of the PDF report saved for each analysis
-- PDFs are stored in: reports/motorman/{hrms_id}/{pdf_filename}

ALTER TABLE div_sub_spm_runs
ADD COLUMN pdf_filename VARCHAR(255) DEFAULT NULL;

-- Add index for faster queries when listing PDFs by motorman
CREATE INDEX idx_spm_runs_pdf ON div_sub_spm_runs (motorman_hrms_id, pdf_filename);
