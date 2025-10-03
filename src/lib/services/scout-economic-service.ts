import { prisma } from '@/lib/db';

export interface ScoutEconomicUpdate {
  scoutId: string;
  field: 'total_investment' | 'net_profits' | 'roi' | 'avg_initial_trfm_value' | 
         'max_profit_report' | 'min_profit_report' | 'avg_profit_report' | 
         'transfer_team_pts' | 'transfer_competition_pts';
  newValue: number;
  updateDate?: Date;
}

export interface ScoutEconomicHistory {
  currentValue: number;
  previousValue?: number;
  changePercent?: number;
  lastUpdated?: Date;
  previousValueDate?: Date;
}

export class ScoutEconomicService {
  /**
   * Actualiza un valor económico de un scout, manteniendo el historial
   */
  static async updateEconomicValue({ scoutId, field, newValue, updateDate = new Date() }: ScoutEconomicUpdate): Promise<void> {
    try {
      // Obtener el valor actual del scout
      const currentScout = await prisma.scout.findUnique({
        where: { id_scout: scoutId },
        select: {
          [field]: true,
          [`${field}_last_updated`]: true
        }
      });

      if (!currentScout) {
        throw new Error(`Scout con ID ${scoutId} no encontrado`);
      }

      const currentValue = currentScout[field as keyof typeof currentScout] as number;
      let changePercent: number | null = null;

      // Calcular el porcentaje de cambio si hay un valor anterior
      if (currentValue && currentValue !== 0) {
        if (field === 'roi') {
          // Para ROI, calcular la diferencia absoluta en puntos porcentuales
          changePercent = newValue - currentValue;
        } else {
          // Para otros campos, calcular el porcentaje de cambio
          changePercent = ((newValue - currentValue) / Math.abs(currentValue)) * 100;
        }
        changePercent = Math.round(changePercent * 10) / 10; // Redondear a 1 decimal
      }

      // Preparar los datos de actualización
      const updateData: any = {
        // Mover el valor actual a "anterior"
        [`previous_${field}`]: currentValue,
        [`previous_${field}_date`]: currentScout[`${field}_last_updated` as keyof typeof currentScout] as Date,
        
        // Establecer el nuevo valor
        [field]: newValue,
        [`${field}_change_percent`]: changePercent,
        [`${field}_last_updated`]: updateDate,
        
        updatedAt: new Date()
      };

      // Actualizar el scout
      await prisma.scout.update({
        where: { id_scout: scoutId },
        data: updateData
      });

      console.log(`✅ Valor económico actualizado para scout ${scoutId} (${field}): ${currentValue || 0} → ${newValue} (${changePercent ? (changePercent > 0 ? '+' : '') + changePercent + (field === 'roi' ? 'pp' : '%') : 'N/A'})`);
    } catch (error) {
      console.error(`❌ Error actualizando valor económico para scout ${scoutId} (${field}):`, error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de un valor económico específico de un scout
   */
  static async getEconomicHistory(scoutId: string, field: string): Promise<ScoutEconomicHistory | null> {
    try {
      const scout = await prisma.scout.findUnique({
        where: { id_scout: scoutId },
        select: {
          [field]: true,
          [`previous_${field}`]: true,
          [`${field}_change_percent`]: true,
          [`${field}_last_updated`]: true,
          [`previous_${field}_date`]: true
        }
      });

      if (!scout) {
        return null;
      }

      return {
        currentValue: scout[field as keyof typeof scout] as number || 0,
        previousValue: scout[`previous_${field}` as keyof typeof scout] as number || undefined,
        changePercent: scout[`${field}_change_percent` as keyof typeof scout] as number || undefined,
        lastUpdated: scout[`${field}_last_updated` as keyof typeof scout] as Date || undefined,
        previousValueDate: scout[`previous_${field}_date` as keyof typeof scout] as Date || undefined
      };
    } catch (error) {
      console.error(`❌ Error obteniendo historial económico para scout ${scoutId} (${field}):`, error);
      throw error;
    }
  }

  /**
   * Actualiza múltiples valores económicos en lote
   */
  static async updateMultipleEconomicValues(updates: ScoutEconomicUpdate[]): Promise<void> {
    console.log(`🔄 Actualizando ${updates.length} valores económicos de scouts...`);
    
    for (const update of updates) {
      await this.updateEconomicValue(update);
    }
    
    console.log(`✅ Completadas ${updates.length} actualizaciones de valores económicos`);
  }

  /**
   * Formatea un valor monetario
   */
  static formatValue(value?: number | null, suffix: string = ' €'): string {
    if (!value) return "Por determinar";
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value) + suffix;
  }

  /**
   * Formatea un valor de ROI
   */
  static formatROI(value?: number | null): string {
    if (!value) return "Por determinar";
    return `${value.toFixed(1)}%`;
  }

  /**
   * Formatea el cambio porcentual para valores económicos
   */
  static formatEconomicChange(changePercent?: number | null, isROI: boolean = false): { 
    text: string; 
    isPositive: boolean; 
    isNeutral: boolean;
    color: string;
    arrow: string;
  } {
    if (changePercent === null || changePercent === undefined) {
      return { 
        text: "", 
        isPositive: false, 
        isNeutral: true,
        color: "text-gray-500",
        arrow: ""
      };
    }
    
    const isPositive = changePercent > 0;
    const isNeutral = changePercent === 0;
    const sign = isPositive ? "+" : "";
    const unit = isROI ? "pp" : "%"; // pp = puntos porcentuales para ROI
    
    return {
      text: `${sign}${changePercent.toFixed(1)}${unit}`,
      isPositive,
      isNeutral,
      color: isPositive ? "text-green-600" : isNeutral ? "text-gray-500" : "text-red-600",
      arrow: isPositive ? "↑" : isNeutral ? "→" : "↓"
    };
  }

  /**
   * Obtiene estadísticas de cambios económicos
   */
  static async getEconomicChangeStats(): Promise<{
    totalScouts: number;
    scoutsWithHistory: number;
    averageROIChange: number;
    averageProfitChange: number;
    topPerformers: Array<{
      id: string;
      name: string;
      netProfitsChange: number;
      roiChange: number;
    }>;
  }> {
    try {
      // Contar scouts totales
      const totalScouts = await prisma.scout.count();

      // Obtener scouts con historial económico
      const scoutsWithHistory = await prisma.scout.findMany({
        where: {
          OR: [
            { net_profits_change_percent: { not: null } },
            { roi_change_percent: { not: null } },
            { total_investment_change_percent: { not: null } }
          ]
        },
        select: {
          id_scout: true,
          scout_name: true,
          name: true,
          net_profits_change_percent: true,
          roi_change_percent: true,
          total_investment_change_percent: true
        }
      });

      const historyCount = scoutsWithHistory.length;

      // Calcular promedios
      const averageROIChange = historyCount > 0 
        ? scoutsWithHistory.reduce((sum, s) => sum + (s.roi_change_percent || 0), 0) / historyCount
        : 0;

      const averageProfitChange = historyCount > 0
        ? scoutsWithHistory.reduce((sum, s) => sum + (s.net_profits_change_percent || 0), 0) / historyCount
        : 0;

      // Top performers (por cambio en beneficios netos)
      const topPerformers = scoutsWithHistory
        .filter(s => s.net_profits_change_percent !== null)
        .sort((a, b) => (b.net_profits_change_percent || 0) - (a.net_profits_change_percent || 0))
        .slice(0, 5)
        .map(s => ({
          id: s.id_scout,
          name: s.scout_name || s.name || 'Scout sin nombre',
          netProfitsChange: s.net_profits_change_percent || 0,
          roiChange: s.roi_change_percent || 0
        }));

      return {
        totalScouts,
        scoutsWithHistory: historyCount,
        averageROIChange: Math.round(averageROIChange * 10) / 10,
        averageProfitChange: Math.round(averageProfitChange * 10) / 10,
        topPerformers
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de cambios económicos:', error);
      throw error;
    }
  }
}