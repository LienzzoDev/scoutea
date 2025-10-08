/**
 * Logger Utility
 *
 * Centraliza y controla todos los logs de la aplicación.
 * En producción, solo se muestran errores y warnings críticos.
 * En desarrollo, se muestran todos los niveles de log.
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LoggerConfig {
  enableInProduction: boolean;
  enableDebugInDevelopment: boolean;
  prefix?: string;
}

class Logger {
  private config: LoggerConfig;
  private isDevelopment: boolean;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.config = {
      enableInProduction: false,
      enableDebugInDevelopment: true,
      ...config,
    };
  }

  /**
   * Determina si se debe mostrar el log según el nivel y el entorno
   */
  private shouldLog(level: LogLevel): boolean {
    // En producción, solo mostrar errores y warnings
    if (!this.isDevelopment) {
      return (
        level === 'error' ||
        level === 'warn' ||
        this.config.enableInProduction
      );
    }

    // En desarrollo, mostrar todo excepto debug si está deshabilitado
    if (level === 'debug' && !this.config.enableDebugInDevelopment) {
      return false;
    }

    return true;
  }

  /**
   * Formatea el mensaje con emoji y color
   */
  private formatMessage(level: LogLevel, message: string): string {
    const emoji = {
      log: '📝',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🐛',
    }[level];

    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
    return `${emoji} ${prefix} ${message}`;
  }

  /**
   * Log general (se muestra solo en desarrollo)
   */
  log(message: string, ...args: unknown[]): void {
    if (this.shouldLog('log')) {
      console.log(this.formatMessage('log', message), ...args);
    }
  }

  /**
   * Log de información (se muestra solo en desarrollo)
   */
  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  /**
   * Warning (se muestra en desarrollo y producción)
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  /**
   * Error (siempre se muestra)
   */
  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), ...args);
    }
  }

  /**
   * Debug (solo en desarrollo si está habilitado)
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  /**
   * Agrupa logs relacionados
   */
  group(label: string): void {
    if (this.isDevelopment) {
      console.group(this.formatMessage('log', label));
    }
  }

  /**
   * Cierra un grupo de logs
   */
  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * Log de tabla (solo en desarrollo)
   */
  table(data: unknown): void {
    if (this.isDevelopment) {
      console.table(data);
    }
  }

  /**
   * Mide el tiempo de ejecución
   */
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  /**
   * Termina la medición de tiempo
   */
  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }
}

// Logger por defecto para toda la aplicación
export const logger = new Logger();

// Loggers específicos por módulo
export const apiLogger = new Logger({ prefix: 'API' });
export const dbLogger = new Logger({ prefix: 'DB' });
export const authLogger = new Logger({ prefix: 'AUTH' });
export const hookLogger = new Logger({ prefix: 'HOOK' });
export const componentLogger = new Logger({ prefix: 'COMPONENT' });

// Función helper para crear loggers personalizados
export function createLogger(prefix: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger({ ...config, prefix });
}

export default logger;
