-- Every foreign key of the app's tables has an index that starts with its
-- columns. Postgres doesn't create one by itself, and without it deleting or
-- changing a row of the referenced table scans the whole referencing table, and
-- so does any join through that column. A new table that forgets its index
-- breaks this test. Same rule as the Supabase advisor (unindexed_foreign_keys), so
-- a partial index counts too: the one on trainer_applications.applicant_id only
-- covers pending rows, which is fine for a table this small. Needs _helpers.sql.
do $$
declare
  v_missing text;
begin
  select string_agg(format('%s.%s', c.conrelid::regclass, c.conname), ', ' order by c.conrelid::regclass::text, c.conname)
    into v_missing
    from pg_constraint c
   where c.contype = 'f'
     and c.connamespace = 'public'::regnamespace
     and not exists (
       select 1
         from pg_index i
        where i.indrelid = c.conrelid
          and i.indisvalid
          and (i.indkey::int2[])[0:cardinality(c.conkey) - 1] = c.conkey
     );

  perform pg_temp.assert_eq('foreign keys without an index', coalesce(v_missing, 'none'), 'none');

  raise exception 'ROLLBACK_TEST: foreign_keys_indexed ok';
end $$;
