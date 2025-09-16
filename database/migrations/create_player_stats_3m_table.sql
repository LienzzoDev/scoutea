-- ========== DOMAINS (reutilizables) ==========
CREATE DOMAIN percent_0_100 AS NUMERIC(5,2)
CHECK (VALUE >= 0 AND VALUE <= 100);

CREATE DOMAIN norm_0_100 AS NUMERIC(5,2)
CHECK (VALUE >= 0 AND VALUE <= 100);

CREATE DOMAIN rate_p90_nonneg AS NUMERIC(7,3)
CHECK (VALUE >= 0);

CREATE DOMAIN count_nonneg AS INTEGER
CHECK (VALUE >= 0);

CREATE DOMAIN rank_pos AS INTEGER
CHECK (VALUE >= 1);

-- ========== TABLA PLAYER_STATS_3M ==========
CREATE TABLE player_stats_3m (
    id_player TEXT NOT NULL,
    wyscout_id BIGINT,
    stats_evo_3m NUMERIC(6,2),
    
    -- Partidos jugados
    matches_played_tot_3m count_nonneg,
    matches_played_tot_3m_norm norm_0_100,
    matches_played_tot_3m_rank rank_pos,
    
    -- Minutos jugados
    minutes_played_tot_3m count_nonneg,
    minutes_played_tot_3m_norm norm_0_100,
    minutes_played_tot_3m_rank rank_pos,
    
    -- Goles
    goals_p90_3m rate_p90_nonneg,
    goals_p90_3m_norm norm_0_100,
    goals_p90_3m_rank rank_pos,
    goals_tot_3m count_nonneg,
    goals_tot_3m_norm norm_0_100,
    
    -- Asistencias
    assists_p90_3m rate_p90_nonneg,
    assists_p90_3m_norm norm_0_100,
    assists_p90_3m_rank rank_pos,
    assists_tot_3m count_nonneg,
    assists_tot_3m_norm norm_0_100,
    
    -- Tarjetas amarillas
    yellow_cards_p90_3m rate_p90_nonneg,
    yellow_cards_p90_3m_norm norm_0_100,
    yellow_cards_p90_rank rank_pos,
    yellow_cards_p90_3m_norm_neg norm_0_100,
    yellow_cards_tot_3m count_nonneg,
    yellow_cards_tot_3m_norm norm_0_100,
    
    -- Tarjetas rojas
    red_cards_p90_3m rate_p90_nonneg,
    red_cards_p90_3m_norm norm_0_100,
    red_cards_p90_rank rank_pos,
    red_cards_p90_3m_norm_neg norm_0_100,
    red_cards_tot_3m count_nonneg,
    red_cards_tot_3m_norm norm_0_100,
    
    -- Goles encajados (porteros)
    conceded_goals_p90_3m rate_p90_nonneg,
    conceded_goals_p90_3m_norm norm_0_100,
    conceded_goals_p90_3m_rank rank_pos,
    conceded_goals_p90_3m_norm_neg norm_0_100,
    conceded_goals_tot_3m count_nonneg,
    conceded_goals_tot_3m_norm norm_0_100,
    
    -- Goles evitados (puede ser negativo)
    prevented_goals_p90_3m NUMERIC(7,3),
    prevented_goals_p90_3m_norm norm_0_100,
    prevented_goals_p90_rank rank_pos,
    prevented_goals_tot_3m NUMERIC(7,3),
    prevented_goals_tot_3m_norm norm_0_100,
    
    -- Disparos en contra
    shots_against_p90_3m rate_p90_nonneg,
    shots_against_p90_3m_norm norm_0_100,
    shots_against_p90_3m_rank rank_pos,
    shots_against_tot_3m count_nonneg,
    shots_against_tot_3m_norm norm_0_100,
    
    -- Porterías a cero
    "clean_sheets_%_3m" percent_0_100,
    "clean_sheets_%_3m_norm" norm_0_100,
    "clean_sheets_%_3m_rank" rank_pos,
    clean_sheets_tot_3m count_nonneg,
    clean_sheets_tot_3m_norm norm_0_100,
    
    -- Porcentaje de paradas
    "save_rate_%_3m" percent_0_100,
    "save_rate_%_3m_norm" norm_0_100,
    "save_rate_%_3m_rank" rank_pos,
    
    -- Entradas
    tackles_p90_3m rate_p90_nonneg,
    tackles_p90_3m_norm norm_0_100,
    tackles_p90_3m_rank rank_pos,
    tackles_tot_3m count_nonneg,
    tackles_tot_3m_norm norm_0_100,
    
    -- Intercepciones
    interceptions_p90_3m rate_p90_nonneg,
    interceptions_p90_3m_norm norm_0_100,
    interceptions_p90_3m_rank rank_pos,
    interceptions_tot_3m count_nonneg,
    interceptions_tot_3m_norm norm_0_100,
    
    -- Faltas
    fouls_p90_3m rate_p90_nonneg,
    fouls_p90_3m_norm norm_0_100,
    fouls_p90_3m_rank rank_pos,
    fouls_p90_3m_norm_neg norm_0_100,
    fouls_tot_3m count_nonneg,
    fouls_tot_3m_norm norm_0_100,
    
    -- Pases
    passes_p90_3m rate_p90_nonneg,
    passes_p90_3m_norm norm_0_100,
    passes_p90_3m_rank rank_pos,
    passes_tot_3m count_nonneg,
    passes_tot_3m_norm norm_0_100,
    
    -- Pases hacia adelante
    forward_passes_p90_3m rate_p90_nonneg,
    forward_passes_p90_3m_norm norm_0_100,
    forward_passes_p90_3m_rank rank_pos,
    forward_passes_tot_3m count_nonneg,
    forward_passes_tot_3m_norm norm_0_100,
    
    -- Centros
    crosses_p90_3m rate_p90_nonneg,
    crosses_p90_3m_norm norm_0_100,
    crosses_p90_3m_rank rank_pos,
    crosses_tot_3m count_nonneg,
    crosses_tot_3m_norm norm_0_100,
    
    -- Precisión de pases
    "accurate_passes_%_3m" percent_0_100,
    "accurate_passes_%_3m_norm" norm_0_100,
    "accurate_passes_%_3m_rank" rank_pos,
    
    -- Disparos
    shots_p90_3m rate_p90_nonneg,
    shots_p90_3m_norm norm_0_100,
    shots_p90_3m_rank rank_pos,
    shots_tot_3m count_nonneg,
    shots_tot_3m_norm norm_0_100,
    
    -- Efectividad
    "effectiveness_%_3m" percent_0_100,
    "effectiveness_%_3m_norm" norm_0_100,
    "effectiveness_%_3m_rank" rank_pos,
    
    -- Duelos ofensivos
    off_duels_p90_3m rate_p90_nonneg,
    off_duels_p90_3m_norm norm_0_100,
    off_duels_p90_3m_rank rank_pos,
    off_duels_tot_3m count_nonneg,
    off_duels_tot_3m_norm norm_0_100,
    "off_duels_won_%_3m" percent_0_100,
    "off_duels_won_%_3m_norm" norm_0_100,
    "off_duels_won_%_3m_rank" rank_pos,
    
    -- Duelos defensivos
    def_duels_p90_3m rate_p90_nonneg,
    def_duels_p90_3m_norm norm_0_100,
    def_duels_p90_3m_rank rank_pos,
    def_duels_tot_3m count_nonneg,
    def_duels_tot_3m_norm norm_0_100,
    "def_duels_won_%_3m" percent_0_100,
    "def_duels_won_%_3m_norm" norm_0_100,
    "def_duels_won_%_3m_rank" rank_pos,
    
    -- Duelos aéreos
    aerials_duels_p90_3m rate_p90_nonneg,
    aerials_duels_p90_3m_norm norm_0_100,
    aerials_duels_p90_3m_rank rank_pos,
    aerials_duels_tot_3m count_nonneg,
    aerials_duels_tot_3m_norm norm_0_100,
    "aerials_duels_won_%_3m" percent_0_100,
    "aerials_duels_won_%_3m_norm" norm_0_100,
    "aerials_duels_won_%_3m_rank" rank_pos,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Clave primaria
    PRIMARY KEY (id_player)
);

-- ========== ÍNDICES ==========
-- Índice principal por id_player (ya incluido en PRIMARY KEY)
CREATE INDEX idx_player_stats_3m_id_player ON player_stats_3m (id_player);

-- Índices para consultas de rendimiento
CREATE INDEX idx_player_stats_3m_goals_p90 ON player_stats_3m (goals_p90_3m DESC);
CREATE INDEX idx_player_stats_3m_assists_p90 ON player_stats_3m (assists_p90_3m DESC);
CREATE INDEX idx_player_stats_3m_stats_evo ON player_stats_3m (stats_evo_3m DESC);

-- Índices para rankings
CREATE INDEX idx_player_stats_3m_goals_rank ON player_stats_3m (goals_p90_3m_rank);
CREATE INDEX idx_player_stats_3m_assists_rank ON player_stats_3m (assists_p90_3m_rank);

-- Índices para porteros
CREATE INDEX idx_player_stats_3m_clean_sheets ON player_stats_3m ("clean_sheets_%_3m" DESC);
CREATE INDEX idx_player_stats_3m_save_rate ON player_stats_3m ("save_rate_%_3m" DESC);

-- Índices para consultas de tiempo
CREATE INDEX idx_player_stats_3m_created_at ON player_stats_3m (created_at DESC);
CREATE INDEX idx_player_stats_3m_updated_at ON player_stats_3m (updated_at DESC);

-- Comentarios en la tabla
COMMENT ON TABLE player_stats_3m IS 'Estadísticas de jugadores de los últimos 3 meses con métricas normalizadas y rankings';
COMMENT ON COLUMN player_stats_3m.id_player IS 'ID del jugador (clave foránea a tabla jugadores)';
COMMENT ON COLUMN player_stats_3m.stats_evo_3m IS 'Evolución estadística en los últimos 3 meses';
COMMENT ON COLUMN player_stats_3m.wyscout_id IS 'ID del jugador en Wyscout';

-- Comentarios en dominios
COMMENT ON DOMAIN percent_0_100 IS 'Porcentaje entre 0 y 100';
COMMENT ON DOMAIN norm_0_100 IS 'Valor normalizado entre 0 y 100';
COMMENT ON DOMAIN rate_p90_nonneg IS 'Tasa por 90 minutos (no negativa)';
COMMENT ON DOMAIN count_nonneg IS 'Contador no negativo';
COMMENT ON DOMAIN rank_pos IS 'Ranking posicional (mínimo 1)';