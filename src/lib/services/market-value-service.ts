import { prisma } from '@/lib/db';

export interface MarketValueUpdate {
  playerId: string;
  newValue: number;
  updateDate?: Date;
}

export interface MarketValueHistory {
  currentValue: number;
  previousValue?: number;
  changePercent?: number;
  lastUpdated?: Date;
  previousValueDate?: Date;
}

export class MarketValueService {
  /**
   * Actualiza el valor de mercado de un jugador, manteniendo el historial
   */
  static async updateMarketValue({ playerId, newValue, updateDate = new Date() }: MarketValueUpdate): Promise<void> {
    try {
      // Obtener el valor actual del jugador
      const currentPlayer = await prisma.jugador.findUnique({
        where: { id_player: playerId },
        select: {
          player_trfm_value: true,
          trfm_value_last_updated: true
        }
      });

      if (!currentPlayer) {
        throw new Error(`Jugador con ID ${playerId} no encontrado`);
      }

      const currentValue = currentPlayer.player_trfm_value;
      let changePercent: number | null = null;

      // Calcular el porcentaje de cambio si hay un valor anterior
      if (currentValue && currentValue > 0) {
        changePercent = ((newValue - currentValue) / currentValue) * 100;
        changePercent = Math.round(changePercent * 10) / 10; // Redondear a 1 decimal
      }

      // Actualizar el jugador
      await prisma.jugador.update({
        where: { id_player: playerId },
        data: {
          // Mover el valor actual a "anterior"
          previous_trfm_value: currentValue,
          previous_trfm_value_date: currentPlayer.trfm_value_last_updated,
          
          // Establecer el nuevo valor
          player_trfm_value: newValue,
          trfm_value_change_percent: changePercent,
          trfm_value_last_updated: updateDate,
          
          updatedAt: new Date()
        }
      });

      console.log(`✅ Valor de mercado actualizado para jugador ${playerId}: ${currentValue || 0} → ${newValue} (${changePercent ? (changePercent > 0 ? '+' : '') + changePercent + '%' : 'N/A'})`);
    } catch (error) {
      console.error(`❌ Error actualizando valor de mercado para jugador ${playerId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de valor de mercado de un jugador
   */
  static async getMarketValueHistory(playerId: string): Promise<MarketValueHistory | null> {
    try {
      const player = await prisma.jugador.findUnique({
        where: { id_player: playerId },
        select: {
          player_trfm_value: true,
          previous_trfm_value: true,
          trfm_value_change_percent: true,
          trfm_value_last_updated: true,
          previous_trfm_value_date: true
        }
      });

      if (!player) {
        return null;
      }

      return {
        currentValue: player.player_trfm_value || 0,
        previousValue: player.previous_trfm_value || undefined,
        changePercent: player.trfm_value_change_percent || undefined,
        lastUpdated: player.trfm_value_last_updated || undefined,
        previousValueDate: player.previous_trfm_value_date || undefined
      };
    } catch (error) {
      console.error(`❌ Error obteniendo historial de valor para jugador ${playerId}:`, error);
      throw error;
    }
  }

  /**
   * Actualiza múltiples valores de mercado en lote
   */
  static async updateMultipleMarketValues(updates: MarketValueUpdate[]): Promise<void> {
    console.log(`🔄 Actualizando ${updates.length} valores de mercado...`);
    
    for (const update of updates) {
      await this.updateMarketValue(update);
    }
    
    console.log(`✅ Completadas ${updates.length} actualizaciones de valor de mercado`);
  }

  /**
   * Obtiene estadísticas de cambios de valor de mercado
   */
  static async getMarketValueStats(): Promise<{
    totalPlayers: number;
    playersWithHistory: number;
    positiveChanges: number;
    negativeChanges: number;
    neutralChanges: number;
    averageChange: number;
    averageCurrentValue: number;
    averagePreviousValue: number;
  }> {
    try {
      // Contar jugadores totales con valor
      const totalPlayers = await prisma.jugador.count({
        where: {
          player_trfm_value: { not: null, gt: 0 }
        }
      });

      // Obtener jugadores con historial
      const playersWithHistory = await prisma.jugador.findMany({
        where: {
          AND: [
            { player_trfm_value: { not: null } },
            { previous_trfm_value: { not: null } },
            { trfm_value_change_percent: { not: null } }
          ]
        },
        select: {
          player_trfm_value: true,
          previous_trfm_value: true,
          trfm_value_change_percent: true
        }
      });

      const historyCount = playersWithHistory.length;
      const positiveChanges = playersWithHistory.filter(p => (p.trfm_value_change_percent || 0) > 0).length;
      const negativeChanges = playersWithHistory.filter(p => (p.trfm_value_change_percent || 0) < 0).length;
      const neutralChanges = playersWithHistory.filter(p => (p.trfm_value_change_percent || 0) === 0).length;

      // Calcular promedios
      const averageChange = historyCount > 0 
        ? playersWithHistory.reduce((sum, p) => sum + (p.trfm_value_change_percent || 0), 0) / historyCount
        : 0;

      const averageCurrentValue = historyCount > 0
        ? playersWithHistory.reduce((sum, p) => sum + (p.player_trfm_value || 0), 0) / historyCount
        : 0;

      const averagePreviousValue = historyCount > 0
        ? playersWithHistory.reduce((sum, p) => sum + (p.previous_trfm_value || 0), 0) / historyCount
        : 0;

      return {
        totalPlayers,
        playersWithHistory: historyCount,
        positiveChanges,
        negativeChanges,
        neutralChanges,
        averageChange: Math.round(averageChange * 10) / 10,
        averageCurrentValue: Math.round(averageCurrentValue),
        averagePreviousValue: Math.round(averagePreviousValue)
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de valor de mercado:', error);
      throw error;
    }
  }

  /**
   * Formatea un valor monetario
   * NOTA: Los valores en la BD están almacenados en millones (ej: 9 = €9M)
   */
  static formatValue(value?: number | null): string {
    if (!value) return "Por determinar";

    // Los valores están en millones, formatear directamente
    if (value >= 1_000) {
      // Billones (B) - si el valor es >= 1000M
      const billions = value / 1_000;
      return `€${billions.toFixed(billions >= 10 ? 1 : 2)}B`;
    } else if (value >= 1) {
      // Millones (M)
      return `€${value.toFixed(value >= 10 ? 1 : 2)}M`;
    } else if (value >= 0.001) {
      // Miles (K) - si el valor es < 1M pero >= 1K
      const thousands = value * 1_000;
      return `€${thousands.toFixed(thousands >= 10 ? 1 : 2)}K`;
    } else {
      // Menor a 1000 euros
      const euros = value * 1_000_000;
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(euros);
    }
  }

  /**
   * Formatea el cambio porcentual
   */
  static formatPercentageChange(changePercent?: number | null): {
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

    return {
      text: `${sign}${changePercent.toFixed(1)}%`,
      isPositive,
      isNeutral,
      color: isPositive ? "text-green-600" : isNeutral ? "text-gray-500" : "text-red-600",
      arrow: isPositive ? "↑" : isNeutral ? "→" : "↓"
    };
  }

  /**
   * Calcula y formatea el cambio absoluto en valor de mercado
   * NOTA: Los valores en la BD están almacenados en millones (ej: 9 = €9M)
   */
  static formatAbsoluteChange(currentValue?: number | null, previousValue?: number | null): {
    text: string;
    isPositive: boolean;
    isNeutral: boolean;
    color: string;
  } {
    if (!currentValue || !previousValue) {
      return {
        text: "",
        isPositive: false,
        isNeutral: true,
        color: "text-gray-500"
      };
    }

    const change = currentValue - previousValue;
    const changeInMillions = Math.abs(change); // Ya está en millones
    const isPositive = change > 0;
    const isNeutral = change === 0;
    const sign = isPositive ? "+" : "-";

    let formattedChange: string;

    // Formatear según el tamaño del número
    if (changeInMillions >= 1_000) {
      // Billones (B)
      const billions = changeInMillions / 1_000;
      formattedChange = `€${billions.toFixed(billions >= 10 ? 1 : 2)}B`;
    } else if (changeInMillions >= 1) {
      // Millones (M)
      formattedChange = `€${changeInMillions.toFixed(changeInMillions >= 10 ? 1 : 2)}M`;
    } else if (changeInMillions >= 0.001) {
      // Miles (K)
      const thousands = changeInMillions * 1_000;
      formattedChange = `€${thousands.toFixed(thousands >= 10 ? 1 : 2)}K`;
    } else {
      // Menor a 1000
      const euros = changeInMillions * 1_000_000;
      formattedChange = `€${euros.toFixed(0)}`;
    }

    return {
      text: isNeutral ? formattedChange : `${sign}${formattedChange}`,
      isPositive,
      isNeutral,
      color: isPositive ? "text-[#3cc500]" : isNeutral ? "text-gray-500" : "text-red-500"
    };
  }
}