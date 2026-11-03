-- ms_stock.article_id: the SOLUM articleId a stock row is linked to. The article data and LED are sent
-- to this article; item_code is now the user's own code and no longer doubles as the articleId.
-- create_all does not add columns to an existing table, so run this once on every database.
-- Rows made before this column existed used item_code as the articleId, so it is copied over.

BEGIN;

ALTER TABLE ms_stock ADD COLUMN IF NOT EXISTS article_id VARCHAR;
CREATE INDEX IF NOT EXISTS ix_ms_stock_article_id ON ms_stock (article_id);

UPDATE ms_stock SET article_id = item_code WHERE article_id IS NULL;

COMMIT;
