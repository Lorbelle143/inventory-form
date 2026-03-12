-- Add feeling_inferior column to mental_health_assessments table
-- This is for the 5th question: "Feeling inferior to others"

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'mental_health_assessments' 
        AND column_name = 'feeling_inferior'
    ) THEN
        ALTER TABLE mental_health_assessments 
        ADD COLUMN feeling_inferior INTEGER NOT NULL DEFAULT 0 
        CHECK (feeling_inferior >= 0 AND feeling_inferior <= 4);
    END IF;
END $$;

-- Update existing records to set feeling_inferior to 0 if null
UPDATE mental_health_assessments 
SET feeling_inferior = 0 
WHERE feeling_inferior IS NULL;
