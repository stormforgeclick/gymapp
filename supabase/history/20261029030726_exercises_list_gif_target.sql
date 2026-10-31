-- The picker previews an exercise from the list row, so the list now carries its
-- GIF and primary muscle.
drop function public.get_exercises(text, uuid, uuid, uuid, uuid, integer, integer, text);

CREATE OR REPLACE FUNCTION public.get_exercises(p_language text, p_category_id uuid DEFAULT NULL::uuid, p_equipment_id uuid DEFAULT NULL::uuid, p_muscle_group_id uuid DEFAULT NULL::uuid, p_target_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0, p_search text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, name text, image text, category text, equipment text, gif_url text, target text)
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  SELECT
    ge.id,
    CASE WHEN p_language = 'es' THEN COALESCE(en.name_es, en.name_en) ELSE en.name_en END AS name,
    ge.image,
    CASE WHEN p_language = 'es' THEN COALESCE(c.name_es, c.name_en) ELSE c.name_en END AS category,
    CASE WHEN p_language = 'es' THEN COALESCE(eq.name_es, eq.name_en) ELSE eq.name_en END AS equipment,
    ge.gif_url,
    CASE WHEN p_language = 'es' THEN COALESCE(tg.name_es, tg.name_en) ELSE tg.name_en END AS target
  FROM gymbro_exercises ge
  JOIN exercise_names en ON en.id = ge.exercise_name_id
  LEFT JOIN categories c ON c.id = ge.category_id
  LEFT JOIN equipment eq ON eq.id = ge.equipment_id
  LEFT JOIN targets tg ON tg.id = ge.target_id
  WHERE
    (p_category_id IS NULL OR ge.category_id = p_category_id)
    AND (p_equipment_id IS NULL OR ge.equipment_id = p_equipment_id)
    AND (p_muscle_group_id IS NULL OR ge.muscle_group_id = p_muscle_group_id)
    AND (p_target_id IS NULL OR ge.target_id = p_target_id)
    AND (
      p_search IS NULL
      OR en.name_en ILIKE '%' || p_search || '%'
      OR en.name_es ILIKE '%' || p_search || '%'
    )
  ORDER BY
    CASE WHEN p_language = 'es' THEN COALESCE(en.name_es, en.name_en) ELSE en.name_en END ASC,
    ge.id ASC
  LIMIT LEAST(p_limit, 100)
  OFFSET p_offset;
$function$;
;
