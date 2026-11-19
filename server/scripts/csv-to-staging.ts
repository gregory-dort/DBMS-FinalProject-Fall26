/**
 * npm run db:csv — OWNER: Teammate B (import)
 *
 * Reads  db/data/grocery_inventory.csv
 * Writes db/import/02_staging_data.sql  (commit the generated file)
 *
 * TODO:
 *   - Parse the CSV (all values are plain, no quoted commas — verify!). Skip the header row.
 *   - For each row emit: INSERT INTO staging_inventory VALUES (rowNum, 'Bell Pepper', ...);
 *     as raw strings — NO cleaning here, all cleaning happens in SQL (03_flag_issues.sql).
 *   - Escape single quotes ('  →  '') in every value.
 *   - Batch ~200 rows per INSERT statement.
 *   - Start the file with:  USE grocery_inventory;
 */
console.error("csv-to-staging.ts is not implemented yet — see the TODO at the top of the file.");
process.exit(1);
