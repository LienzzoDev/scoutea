-- Script de migración: Convertir id_player de String a Int auto-incremental
-- Preserva todos los datos y asigna IDs correlativos

BEGIN;

-- PASO 1: Crear columna temporal para el nuevo ID
ALTER TABLE jugadores ADD COLUMN id_player_new SERIAL;

-- PASO 2: Crear tabla temporal con mapping de IDs
CREATE TEMP TABLE id_mapping AS
SELECT 
  id_player as old_id,
  id_player_new as new_id
FROM jugadores;

-- PASO 3: Eliminar todas las foreign key constraints existentes
ALTER TABLE reportes DROP CONSTRAINT IF EXISTS reportes_id_player_fkey;
ALTER TABLE radar_metrics DROP CONSTRAINT IF EXISTS radar_metrics_playerId_fkey;
ALTER TABLE data_population_log DROP CONSTRAINT IF EXISTS data_population_log_playerId_fkey;
ALTER TABLE beeswarm_data DROP CONSTRAINT IF EXISTS beeswarm_data_playerId_fkey;
ALTER TABLE lollipop_data DROP CONSTRAINT IF EXISTS lollipop_data_playerId_fkey;
ALTER TABLE player_lists DROP CONSTRAINT IF EXISTS player_lists_playerId_fkey;
ALTER TABLE player_stats_3m DROP CONSTRAINT IF EXISTS player_stats_3m_id_player_fkey;
ALTER TABLE player_stats_6m DROP CONSTRAINT IF EXISTS player_stats_6m_id_player_fkey;
ALTER TABLE player_stats_1y DROP CONSTRAINT IF EXISTS player_stats_1y_id_player_fkey;
ALTER TABLE player_stats_2y DROP CONSTRAINT IF EXISTS player_stats_2y_id_player_fkey;
ALTER TABLE atributos DROP CONSTRAINT IF EXISTS atributos_id_player_fkey;
ALTER TABLE player_corrections DROP CONSTRAINT IF EXISTS player_corrections_player_id_fkey;
ALTER TABLE player_metrics DROP CONSTRAINT IF EXISTS player_metrics_player_id_fkey;
ALTER TABLE player_roles DROP CONSTRAINT IF EXISTS player_roles_player_id_fkey;
ALTER TABLE player_attributes DROP CONSTRAINT IF EXISTS player_attributes_player_id_fkey;

-- PASO 4: Actualizar todas las foreign keys en otras tablas
-- Nota: Primero actualizamos todas las referencias antes de cambiar el tipo

-- Actualizar reportes
UPDATE reportes SET id_player = (
  SELECT CAST(new_id AS TEXT) 
  FROM id_mapping 
  WHERE old_id = reportes.id_player
) WHERE id_player IS NOT NULL;

-- Actualizar radar_metrics
UPDATE radar_metrics SET "playerId" = (
  SELECT CAST(new_id AS TEXT)
  FROM id_mapping
  WHERE old_id = radar_metrics."playerId"
) WHERE "playerId" IS NOT NULL;

-- Actualizar data_population_log
UPDATE data_population_log SET "playerId" = (
  SELECT CAST(new_id AS TEXT)
  FROM id_mapping
  WHERE old_id = data_population_log."playerId"
) WHERE "playerId" IS NOT NULL;

-- Actualizar beeswarm_data
UPDATE beeswarm_data SET "playerId" = (
  SELECT CAST(new_id AS TEXT)
  FROM id_mapping
  WHERE old_id = beeswarm_data."playerId"
) WHERE "playerId" IS NOT NULL;

-- Actualizar lollipop_data
UPDATE lollipop_data SET "playerId" = (
  SELECT CAST(new_id AS TEXT)
  FROM id_mapping
  WHERE old_id = lollipop_data."playerId"
) WHERE "playerId" IS NOT NULL;

-- Actualizar player_lists
UPDATE player_lists SET "playerId" = (
  SELECT CAST(new_id AS TEXT)
  FROM id_mapping
  WHERE old_id = player_lists."playerId"
) WHERE "playerId" IS NOT NULL;

-- Actualizar player_stats_3m
UPDATE player_stats_3m SET id_player = (
  SELECT CAST(new_id AS TEXT)
  FROM id_mapping
  WHERE old_id = player_stats_3m.id_player
) WHERE id_player IS NOT NULL;

-- Actualizar player_stats_6m
UPDATE player_stats_6m SET id_player = (
  SELECT CAST(new_id AS TEXT)
  FROM id_mapping
  WHERE old_id = player_stats_6m.id_player
) WHERE id_player IS NOT NULL;

-- Actualizar player_stats_1y
UPDATE player_stats_1y SET id_player = (
  SELECT CAST(new_id AS TEXT)
  FROM id_mapping
  WHERE old_id = player_stats_1y.id_player
) WHERE id_player IS NOT NULL;

-- Actualizar player_stats_2y
UPDATE player_stats_2y SET id_player = (
  SELECT CAST(new_id AS TEXT)
  FROM id_mapping
  WHERE old_id = player_stats_2y.id_player
) WHERE id_player IS NOT NULL;

-- Actualizar atributos
UPDATE atributos SET id_player = (
  SELECT CAST(new_id AS TEXT)
  FROM id_mapping
  WHERE old_id = atributos.id_player
) WHERE id_player IS NOT NULL;

-- Actualizar player_corrections
UPDATE player_corrections SET player_id = (
  SELECT CAST(new_id AS TEXT)
  FROM id_mapping
  WHERE old_id = player_corrections.player_id
) WHERE player_id IS NOT NULL;

-- Actualizar player_metrics
UPDATE player_metrics SET player_id = (
  SELECT CAST(new_id AS TEXT)
  FROM id_mapping
  WHERE old_id = player_metrics.player_id
) WHERE player_id IS NOT NULL;

-- Actualizar player_roles
UPDATE player_roles SET player_id = (
  SELECT CAST(new_id AS TEXT)
  FROM id_mapping
  WHERE old_id = player_roles.player_id
) WHERE player_id IS NOT NULL;

-- Actualizar player_attributes
UPDATE player_attributes SET player_id = (
  SELECT CAST(new_id AS TEXT)
  FROM id_mapping
  WHERE old_id = player_attributes.player_id
) WHERE player_id IS NOT NULL;

-- PASO 5: Ahora cambiar la columna id_player en jugadores
-- Primero eliminar el constraint de primary key (CASCADE para eliminar foreign keys dependientes)
ALTER TABLE jugadores DROP CONSTRAINT jugadores_pkey CASCADE;

-- Eliminar la columna vieja
ALTER TABLE jugadores DROP COLUMN id_player;

-- Renombrar la nueva columna
ALTER TABLE jugadores RENAME COLUMN id_player_new TO id_player;

-- Agregar primary key de nuevo
ALTER TABLE jugadores ADD PRIMARY KEY (id_player);

-- PASO 6: Convertir las columnas de foreign keys a INTEGER
ALTER TABLE reportes ALTER COLUMN id_player TYPE INTEGER USING id_player::integer;
ALTER TABLE radar_metrics ALTER COLUMN "playerId" TYPE INTEGER USING "playerId"::integer;
ALTER TABLE data_population_log ALTER COLUMN "playerId" TYPE INTEGER USING "playerId"::integer;
ALTER TABLE beeswarm_data ALTER COLUMN "playerId" TYPE INTEGER USING "playerId"::integer;
ALTER TABLE lollipop_data ALTER COLUMN "playerId" TYPE INTEGER USING "playerId"::integer;
ALTER TABLE player_lists ALTER COLUMN "playerId" TYPE INTEGER USING "playerId"::integer;
ALTER TABLE player_stats_3m ALTER COLUMN id_player TYPE INTEGER USING id_player::integer;
ALTER TABLE player_stats_6m ALTER COLUMN id_player TYPE INTEGER USING id_player::integer;
ALTER TABLE player_stats_1y ALTER COLUMN id_player TYPE INTEGER USING id_player::integer;
ALTER TABLE player_stats_2y ALTER COLUMN id_player TYPE INTEGER USING id_player::integer;
ALTER TABLE atributos ALTER COLUMN id_player TYPE INTEGER USING id_player::integer;
ALTER TABLE player_corrections ALTER COLUMN player_id TYPE INTEGER USING player_id::integer;
ALTER TABLE player_metrics ALTER COLUMN player_id TYPE INTEGER USING player_id::integer;
ALTER TABLE player_roles ALTER COLUMN player_id TYPE INTEGER USING player_id::integer;
ALTER TABLE player_attributes ALTER COLUMN player_id TYPE INTEGER USING player_id::integer;

-- PASO 7: Recrear foreign keys
ALTER TABLE reportes ADD CONSTRAINT reportes_id_player_fkey FOREIGN KEY (id_player) REFERENCES jugadores(id_player) ON DELETE SET NULL;
ALTER TABLE radar_metrics ADD CONSTRAINT radar_metrics_playerId_fkey FOREIGN KEY ("playerId") REFERENCES jugadores(id_player) ON DELETE CASCADE;
ALTER TABLE data_population_log ADD CONSTRAINT data_population_log_playerId_fkey FOREIGN KEY ("playerId") REFERENCES jugadores(id_player) ON DELETE CASCADE;
ALTER TABLE beeswarm_data ADD CONSTRAINT beeswarm_data_playerId_fkey FOREIGN KEY ("playerId") REFERENCES jugadores(id_player) ON DELETE CASCADE;
ALTER TABLE lollipop_data ADD CONSTRAINT lollipop_data_playerId_fkey FOREIGN KEY ("playerId") REFERENCES jugadores(id_player) ON DELETE CASCADE;
ALTER TABLE player_lists ADD CONSTRAINT player_lists_playerId_fkey FOREIGN KEY ("playerId") REFERENCES jugadores(id_player) ON DELETE CASCADE;
ALTER TABLE player_stats_3m ADD CONSTRAINT player_stats_3m_id_player_fkey FOREIGN KEY (id_player) REFERENCES jugadores(id_player) ON DELETE CASCADE;
ALTER TABLE player_stats_6m ADD CONSTRAINT player_stats_6m_id_player_fkey FOREIGN KEY (id_player) REFERENCES jugadores(id_player) ON DELETE CASCADE;
ALTER TABLE player_stats_1y ADD CONSTRAINT player_stats_1y_id_player_fkey FOREIGN KEY (id_player) REFERENCES jugadores(id_player) ON DELETE CASCADE;
ALTER TABLE player_stats_2y ADD CONSTRAINT player_stats_2y_id_player_fkey FOREIGN KEY (id_player) REFERENCES jugadores(id_player) ON DELETE CASCADE;
ALTER TABLE atributos ADD CONSTRAINT atributos_id_player_fkey FOREIGN KEY (id_player) REFERENCES jugadores(id_player) ON DELETE CASCADE;
ALTER TABLE player_corrections ADD CONSTRAINT player_corrections_player_id_fkey FOREIGN KEY (player_id) REFERENCES jugadores(id_player) ON DELETE CASCADE;
ALTER TABLE player_metrics ADD CONSTRAINT player_metrics_player_id_fkey FOREIGN KEY (player_id) REFERENCES jugadores(id_player) ON DELETE CASCADE;
ALTER TABLE player_roles ADD CONSTRAINT player_roles_player_id_fkey FOREIGN KEY (player_id) REFERENCES jugadores(id_player) ON DELETE CASCADE;
ALTER TABLE player_attributes ADD CONSTRAINT player_attributes_player_id_fkey FOREIGN KEY (player_id) REFERENCES jugadores(id_player) ON DELETE CASCADE;

COMMIT;
