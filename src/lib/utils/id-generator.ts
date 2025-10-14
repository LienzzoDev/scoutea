/**
 * Generador de IDs secuenciales con formato legible
 *
 * Formatos soportados:
 * - Reportes: REP-2025-00001, REP-2025-00002, etc.
 * - Torneos: TOR-2025-00001, etc.
 */

import { prisma } from "@/lib/db";

/**
 * Genera un nuevo ID secuencial para reportes
 * Formato: REP-YYYY-NNNNN
 * Ejemplo: REP-2025-00001
 */
export async function generateReportId(year?: number): Promise<string> {
  const targetYear = year || new Date().getFullYear();

  // Usar transacción para evitar race conditions
  const result = await prisma.$transaction(async (tx) => {
    // Buscar o crear contador para este año
    let counter = await tx.sequenceCounter.findUnique({
      where: {
        entity_type_year: {
          entity_type: 'reporte',
          year: targetYear,
        },
      },
    });

    if (!counter) {
      // Crear nuevo contador para este año
      counter = await tx.sequenceCounter.create({
        data: {
          entity_type: 'reporte',
          year: targetYear,
          last_number: 1,
        },
      });
    } else {
      // Incrementar contador existente
      counter = await tx.sequenceCounter.update({
        where: {
          entity_type_year: {
            entity_type: 'reporte',
            year: targetYear,
          },
        },
        data: {
          last_number: {
            increment: 1,
          },
        },
      });
    }

    return counter.last_number;
  });

  // Formatear ID: REP-YYYY-NNNNN (con padding de 5 dígitos)
  const paddedNumber = result.toString().padStart(5, '0');
  return `REP-${targetYear}-${paddedNumber}`;
}

/**
 * Genera un nuevo ID secuencial para torneos
 * Formato: TOR-YYYY-NNNNN
 * Ejemplo: TOR-2025-00001
 */
export async function generateTournamentId(year?: number): Promise<string> {
  const targetYear = year || new Date().getFullYear();

  const result = await prisma.$transaction(async (tx) => {
    let counter = await tx.sequenceCounter.findUnique({
      where: {
        entity_type_year: {
          entity_type: 'torneo',
          year: targetYear,
        },
      },
    });

    if (!counter) {
      counter = await tx.sequenceCounter.create({
        data: {
          entity_type: 'torneo',
          year: targetYear,
          last_number: 1,
        },
      });
    } else {
      counter = await tx.sequenceCounter.update({
        where: {
          entity_type_year: {
            entity_type: 'torneo',
            year: targetYear,
          },
        },
        data: {
          last_number: {
            increment: 1,
          },
        },
      });
    }

    return counter.last_number;
  });

  const paddedNumber = result.toString().padStart(5, '0');
  return `TOR-${targetYear}-${paddedNumber}`;
}

/**
 * Valida que un ID de reporte tenga el formato correcto
 */
export function isValidReportId(id: string): boolean {
  const pattern = /^REP-\d{4}-\d{5}$/;
  return pattern.test(id);
}

/**
 * Extrae el año y número de secuencia de un ID de reporte
 */
export function parseReportId(id: string): { year: number; sequence: number } | null {
  const match = id.match(/^REP-(\d{4})-(\d{5})$/);
  if (!match) return null;

  return {
    year: parseInt(match[1], 10),
    sequence: parseInt(match[2], 10),
  };
}

/**
 * Obtiene el siguiente número en la secuencia sin incrementar (solo lectura)
 */
export async function getNextReportNumber(year?: number): Promise<number> {
  const targetYear = year || new Date().getFullYear();

  const counter = await prisma.sequenceCounter.findUnique({
    where: {
      entity_type_year: {
        entity_type: 'reporte',
        year: targetYear,
      },
    },
  });

  return counter ? counter.last_number + 1 : 1;
}

// ============================================================================
// GENERADORES DE ID PARA JUGADORES
// ============================================================================

/**
 * Genera un nuevo ID secuencial para jugadores
 * Formato: PLY-NNNNN
 * Ejemplo: PLY-00001, PLY-00002
 *
 * Nota: No usa año porque los jugadores son entidades permanentes
 */
export async function generatePlayerId(): Promise<string> {
  // Usar año 0 como comodín para contador global (sin año)
  const GLOBAL_YEAR = 0;

  const result = await prisma.$transaction(async (tx) => {
    let counter = await tx.sequenceCounter.findUnique({
      where: {
        entity_type_year: {
          entity_type: 'jugador',
          year: GLOBAL_YEAR,
        },
      },
    });

    if (!counter) {
      counter = await tx.sequenceCounter.create({
        data: {
          entity_type: 'jugador',
          year: GLOBAL_YEAR,
          last_number: 1,
        },
      });
    } else {
      counter = await tx.sequenceCounter.update({
        where: {
          entity_type_year: {
            entity_type: 'jugador',
            year: GLOBAL_YEAR,
          },
        },
        data: {
          last_number: {
            increment: 1,
          },
        },
      });
    }

    return counter.last_number;
  });

  // Formatear ID: PLY-NNNNN (con padding de 5 dígitos)
  const paddedNumber = result.toString().padStart(5, '0');
  return `PLY-${paddedNumber}`;
}

/**
 * Valida que un ID de jugador tenga el formato correcto
 */
export function isValidPlayerId(id: string): boolean {
  const pattern = /^PLY-\d{5}$/;
  return pattern.test(id);
}

/**
 * Extrae el número de secuencia de un ID de jugador
 */
export function parsePlayerId(id: string): { sequence: number } | null {
  const match = id.match(/^PLY-(\d{5})$/);
  if (!match) return null;

  return {
    sequence: parseInt(match[1], 10),
  };
}

/**
 * Obtiene el siguiente número en la secuencia de jugadores sin incrementar
 */
export async function getNextPlayerNumber(): Promise<number> {
  const GLOBAL_YEAR = 0;

  const counter = await prisma.sequenceCounter.findUnique({
    where: {
      entity_type_year: {
        entity_type: 'jugador',
        year: GLOBAL_YEAR,
      },
    },
  });

  return counter ? counter.last_number + 1 : 1;
}
