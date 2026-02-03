ALTER TABLE seva_catalog ADD COLUMN name_kan TEXT DEFAULT NULL;
UPDATE seva_catalog SET name_kan = name_eng;
