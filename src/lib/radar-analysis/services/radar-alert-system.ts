/**
 * RadarAlertSystem
 * 
 * Automatic alert system for detecting critical radar analysis issues
 * and notifying administrators with escalation based on severity.
 */

import {
  IRadarAlertSystem,
  AlertNotification,
  AlertEscalation,
  AlertThreshold
} from '../interfaces';
import { radarAnalysisLogger } from '../logging/radar-analysis-logger';
import {
  AnalysisIssue,
  AnalysisContext,
  ConsolidatedReport,
  AnalysisSeverity,
  AnalysisCategory
} from '../types';

/**
 * Alert severity levels for escalation
 */
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';

/**
 * Alert notification channels
 */
export type NotificationChannel = 'email' | 'slack' | 'webhook' | 'console';

/**
 * Alert configuration
 */
interface AlertConfig {
  enabled: boolean;
  channels: NotificationChannel[];
  escalationRules: AlertEscalation[];
  thresholds: AlertThreshold[];
  cooldownPeriod: number; // minutes
}

/**
 * Alert notification structure
 */
interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  category: AnalysisCategory;
  context: AnalysisContext;
  issues: AnalysisIssue[];
  timestamp: Date;
  escalationLevel: number;
  channels: NotificationChannel[];
  metadata?: Record<string, any>;
}

/**
 * Alert history for tracking and cooldown
 */
interface AlertHistory {
  alertId: string;
  lastSent: Date;
  escalationLevel: number;
  sentCount: number;
}

/**
 * Default alert configuration
 */
const DEFAULT_CONFIG: AlertConfig = {
  enabled: true,
  channels: ['console', 'email'],
  escalationRules: [
    {
      level: 1,
      delay: 0, // immediate
      channels: ['console'],
      condition: 'critical_issues > 0'
    },
    {
      level: 2,
      delay: 15, // 15 minutes
      channels: ['email'],
      condition: 'critical_issues > 2 OR overall_score < 50'
    },
    {
      level: 3,
      delay: 60, // 1 hour
      channels: ['slack', 'webhook'],
      condition: 'critical_issues > 5 OR overall_score < 30'
    }
  ],
  thresholds: [
    {
      metric: 'overall_score',
      operator: '<',
      value: 70,
      severity: 'warning'
    },
    {
      metric: 'overall_score',
      operator: '<',
      value: 50,
      severity: 'critical'
    },
    {
      metric: 'critical_issues',
      operator: '>',
      value: 0,
      severity: 'warning'
    },
    {
      metric: 'critical_issues',
      operator: '>',
      value: 3,
      severity: 'critical'
    },
    {
      metric: 'pass_rate',
      operator: '<',
      value: 80,
      severity: 'warning'
    },
    {
      metric: 'pass_rate',
      operator: '<',
      value: 60,
      severity: 'critical'
    }
  ],
  cooldownPeriod: 30 // 30 minutes
};

export class RadarAlertSystem implements IRadarAlertSystem {
  private config: AlertConfig;
  private alertHistory: Map<string, AlertHistory> = new Map();
  private notificationHandlers: Map<NotificationChannel, (alert: Alert) => Promise<void>> = new Map();

  constructor(config?: Partial<AlertConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupDefaultNotificationHandlers();
  }

  /**
   * Analyze report and trigger alerts if necessary
   */
  async analyzeAndAlert(report: ConsolidatedReport): Promise<AlertNotification[]> {
    if (!this.config.enabled) {
      return [];
    }

    try {
      radarAnalysisLogger.logAnalysisStart({
        ...report.context,
        analysisId: `alert-analysis-${Date.now()}`
      });

      const alerts = await this.detectAlerts(report);
      const notifications: AlertNotification[] = [];

      for (const alert of alerts) {
        if (this.shouldSendAlert(alert)) {
          const notification = await this.sendAlert(alert);
          notifications.push(notification);
          this.updateAlertHistory(alert);
        }
      }

      return notifications;
    } catch (_error) {
      radarAnalysisLogger.logAnalysisError(report.context, error as Error);
      throw error;
    }
  }

  /**
   * Detect alerts based on report analysis
   */
  private async detectAlerts(report: ConsolidatedReport): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Check threshold-based alerts
    for (const threshold of this.config.thresholds) {
      const alert = this.checkThreshold(report, threshold);
      if (alert) {
        alerts.push(alert);
      }
    }

    // Check for critical issues
    const criticalIssuesAlert = this.checkCriticalIssues(report);
    if (criticalIssuesAlert) {
      alerts.push(criticalIssuesAlert);
    }

    // Check for performance degradation
    const performanceAlert = this.checkPerformanceDegradation(report);
    if (performanceAlert) {
      alerts.push(performanceAlert);
    }

    // Check for system failures
    const systemFailureAlert = this.checkSystemFailures(report);
    if (systemFailureAlert) {
      alerts.push(systemFailureAlert);
    }

    return alerts;
  }

  /**
   * Check threshold-based conditions
   */
  private checkThreshold(report: ConsolidatedReport, threshold: AlertThreshold): Alert | null {
    const value = this.getMetricValue(report, threshold.metric);
    const conditionMet = this.evaluateCondition(value, threshold.operator, threshold.value);

    if (!conditionMet) {
      return null;
    }

    const alertSeverity = this.mapSeverityToAlert(threshold.severity);
    const escalationLevel = this.getEscalationLevel(alertSeverity);

    return {
      id: `threshold-${threshold.metric}`,
      severity: alertSeverity,
      title: `${threshold.metric} threshold exceeded`,
      message: `${threshold.metric} is ${value}, which ${threshold.operator} ${threshold.value}`,
      category: 'performance',
      _context: report.context,
      issues: [],
      timestamp: new Date(),
      escalationLevel,
      channels: this.getChannelsForLevel(escalationLevel),
      metadata: {
        threshold,
        actualValue: value
      }
    };
  }

  /**
   * Check for critical issues requiring immediate attention
   */
  private checkCriticalIssues(report: ConsolidatedReport): Alert | null {
    const criticalIssues = report.consolidatedIssues.filter(
      issue => issue.severity === 'critical'
    );

    if (criticalIssues.length === 0) {
      return null;
    }

    return {
      id: `critical-issues`,
      severity: 'emergency',
      title: `${criticalIssues.length} Critical Issues Detected`,
      message: `Critical issues found in radar analysis: ${criticalIssues.map(i => i.title).join(', ')}`,
      category: 'data',
      _context: report.context,
      issues: criticalIssues,
      timestamp: new Date(),
      escalationLevel: 3,
      channels: this.getChannelsForLevel(3),
      metadata: {
        criticalIssueCount: criticalIssues.length,
        affectedComponents: [...new Set(criticalIssues.map(i => i.affectedComponent))]
      }
    };
  }

  /**
   * Check for performance degradation
   */
  private checkPerformanceDegradation(report: ConsolidatedReport): Alert | null {
    const performanceMetrics = report.summary.averagePerformance;
    const issues: string[] = [];

    if (performanceMetrics.apiResponseTime > 2000) {
      issues.push(`API response time: ${performanceMetrics.apiResponseTime}ms`);
    }

    if (performanceMetrics.cacheHitRate < 70) {
      issues.push(`Cache hit rate: ${performanceMetrics.cacheHitRate}%`);
    }

    if (performanceMetrics.calculationTime > 1000) {
      issues.push(`Calculation time: ${performanceMetrics.calculationTime}ms`);
    }

    if (issues.length === 0) {
      return null;
    }

    return {
      id: `performance-degradation`,
      severity: 'critical',
      title: 'Performance Degradation Detected',
      message: `Performance issues detected: ${issues.join(', ')}`,
      category: 'performance',
      _context: report.context,
      issues: [],
      timestamp: new Date(),
      escalationLevel: 2,
      channels: this.getChannelsForLevel(2),
      metadata: {
        performanceMetrics,
        degradationAreas: issues
      }
    };
  }

  /**
   * Check for system failures
   */
  private checkSystemFailures(report: ConsolidatedReport): Alert | null {
    const systemFailures = report.consolidatedIssues.filter(
      issue => issue.affectedComponent.includes('System') || 
               issue.title.toLowerCase().includes('failure') ||
               issue.title.toLowerCase().includes('error')
    );

    if (systemFailures.length === 0) {
      return null;
    }

    return {
      id: `system-failures`,
      severity: 'emergency',
      title: 'System Failures Detected',
      message: `System failures detected: ${systemFailures.map(i => i.title).join(', ')}`,
      category: 'data',
      _context: report.context,
      issues: systemFailures,
      timestamp: new Date(),
      escalationLevel: 3,
      channels: this.getChannelsForLevel(3),
      metadata: {
        failureCount: systemFailures.length,
        affectedSystems: [...new Set(systemFailures.map(i => i.affectedComponent))]
      }
    };
  }

  /**
   * Send alert through configured channels
   */
  private async sendAlert(alert: Alert): Promise<AlertNotification> {
    const sentChannels: NotificationChannel[] = [];
    const errors: string[] = [];

    for (const channel of alert.channels) {
      try {
        const handler = this.notificationHandlers.get(channel);
        if (handler) {
          await handler(alert);
          sentChannels.push(channel);
        } else {
          errors.push(`No handler configured for channel: ${channel}`);
        }
      } catch (_error) {
        errors.push(`Failed to send to ${channel}: ${error}`);
      }
    }

    const notification: AlertNotification = {
      alertId: alert.id,
      timestamp: new Date(),
      channels: sentChannels,
      success: errors.length === 0,
      errors,
      escalationLevel: alert.escalationLevel,
      metadata: {
        alert,
        attemptedChannels: alert.channels
      }
    };

    radarAnalysisLogger.logAnalysisComplete(alert.context, {
      analysisId: alert.id,
      _playerId: alert.context.playerId,
      timestamp: alert.timestamp,
      depth: alert.context.depth,
      overallStatus: 'warning',
      issues: alert.issues,
      performanceMetrics: {
        calculationTime: 0,
        renderingTime: 0,
        cacheHitRate: 0,
        apiResponseTime: 0,
        memoryUsage: 0,
        userInteractionLatency: 0,
        totalTime: 0
      },
      dataValidation: { completeness: 'pass', consistency: 'pass', accuracy: 'pass', sourceData: 'pass', issues: [], details: {} },
      layerValidation: { playerLayer: 'pass', comparisonLayer: 'pass', layerInteraction: 'pass', visualConsistency: 'pass', issues: [], details: {} },
      recommendations: [],
      metadata: notification.metadata
    });

    return notification;
  }

  /**
   * Check if alert should be sent based on cooldown and history
   */
  private shouldSendAlert(alert: Alert): boolean {
    const history = this.alertHistory.get(alert.id);
    
    if (!history) {
      return true; // First time sending this alert
    }

    const timeSinceLastSent = Date.now() - history.lastSent.getTime();
    const cooldownMs = this.config.cooldownPeriod * 60 * 1000;

    return timeSinceLastSent >= cooldownMs;
  }

  /**
   * Update alert history for tracking
   */
  private updateAlertHistory(alert: Alert): void {
    const existing = this.alertHistory.get(alert.id);
    
    this.alertHistory.set(alert.id, {
      alertId: alert.id,
      lastSent: new Date(),
      escalationLevel: alert.escalationLevel,
      sentCount: existing ? existing.sentCount + 1 : 1
    });
  }

  /**
   * Setup default notification handlers
   */
  private setupDefaultNotificationHandlers(): void {
    // Console handler
    this.notificationHandlers.set('console', async (alert: Alert) => {
      console.warn(`[RADAR ALERT] ${alert.severity.toUpperCase()}: ${alert.title}`);
      console.warn(`Message: ${alert.message}`);
      console.warn(`Context: Player ${alert.context.playerId}, Analysis ${alert.context.analysisId}`);
      if (alert.issues.length > 0) {
        console.warn(`Issues: ${alert.issues.map(i => i.title).join(', ')}`);
      }
    });

    // Email handler (placeholder - would integrate with actual email service)
    this.notificationHandlers.set('email', async (alert: Alert) => {
      console.log(`[EMAIL ALERT] Would send email alert: ${alert.title}`);
      // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
    });

    // Slack handler (placeholder - would integrate with Slack API)
    this.notificationHandlers.set('slack', async (alert: Alert) => {
      console.log(`[SLACK ALERT] Would send Slack alert: ${alert.title}`);
      // TODO: Integrate with Slack webhook or API
    });

    // Webhook handler (placeholder - would send to configured webhook URL)
    this.notificationHandlers.set('webhook', async (alert: Alert) => {
      console.log(`[WEBHOOK ALERT] Would send webhook alert: ${alert.title}`);
      // TODO: Send HTTP POST to configured webhook URL
    });
  }

  /**
   * Register custom notification handler
   */
  registerNotificationHandler(
    channel: NotificationChannel, 
    handler: (alert: Alert) => Promise<void>
  ): void {
    this.notificationHandlers.set(channel, handler);
  }

  /**
   * Get metric value from report
   */
  private getMetricValue(report: ConsolidatedReport, metric: string): number {
    switch (metric) {
      case 'overall_score':
        return report.overallScore;
      case 'critical_issues':
        return report.summary.criticalIssues;
      case 'pass_rate':
        return report.summary.passRate;
      case 'api_response_time':
        return report.summary.averagePerformance.apiResponseTime;
      case 'cache_hit_rate':
        return report.summary.averagePerformance.cacheHitRate;
      default:
        return 0;
    }
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '<': return value < threshold;
      case '<=': return value <= threshold;
      case '>': return value > threshold;
      case '>=': return value >= threshold;
      case '=': return value === threshold;
      case '!=': return value !== threshold;
      default: return false;
    }
  }

  /**
   * Map analysis severity to alert severity
   */
  private mapSeverityToAlert(severity: AnalysisSeverity): AlertSeverity {
    switch (severity) {
      case 'critical': return 'emergency';
      case 'high': return 'critical';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  }

  /**
   * Get escalation level based on alert severity
   */
  private getEscalationLevel(severity: AlertSeverity): number {
    switch (severity) {
      case 'emergency': return 3;
      case 'critical': return 2;
      case 'warning': return 1;
      case 'info': return 0;
      default: return 0;
    }
  }

  /**
   * Get notification channels for escalation level
   */
  private getChannelsForLevel(level: number): NotificationChannel[] {
    const rule = this.config.escalationRules.find(r => r.level === level);
    return rule ? rule.channels : ['console'];
  }

  /**
   * Update alert configuration
   */
  updateConfig(_config: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current alert configuration
   */
  getConfig(): AlertConfig {
    return { ...this.config };
  }

  /**
   * Clear alert history (useful for testing)
   */
  clearHistory(): void {
    this.alertHistory.clear();
  }

  /**
   * Get alert history
   */
  getHistory(): AlertHistory[] {
    return Array.from(this.alertHistory.values());
  }
}

// Export singleton instance
export const radarAlertSystem = new RadarAlertSystem();