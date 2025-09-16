-- Eliminar tablas PlayerStats y PlayerStatsV2
-- Estas tablas serán reemplazadas por la funcionalidad basada en la tabla atributos

-- Eliminar tabla player_stats_v2
DROP TABLE IF EXISTS player_stats_v2 CASCADE;

-- Eliminar tabla player_stats
DROP TABLE IF EXISTS player_stats CASCADE;

-- Comentario sobre la migración
COMMENT ON SCHEMA public IS 'Eliminadas tablas player_stats y player_stats_v2. Funcionalidad migrada a tabla atributos.';