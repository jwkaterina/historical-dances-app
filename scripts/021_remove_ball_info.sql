-- Remove ball info columns (content moved to FAQs page)
ALTER TABLE balls DROP COLUMN IF EXISTS info_de;
ALTER TABLE balls DROP COLUMN IF EXISTS info_ru;
