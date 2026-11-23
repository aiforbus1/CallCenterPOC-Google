/**
 * Egyptian Police Hotline (122) - System Performance & Operational Metrics
 * 
 * IMPORTANT:
 * - All numeric metrics are typed strictly as `number | null`.
 * - In accordance with specifications: Do NOT invent statistics.
 * - Any component that displays a metric MUST render nothing (or a hidden placeholder)
 *   when the metric value is null.
 */

export interface SystemMetrics {
  /** Known official emergency hotline number for Egyptian Police (النجدة) */
  readonly hotlineShortCode: number | null;

  /** Call answering latency in seconds (null: awaiting certified lab evaluation) */
  readonly callAnswerTimeSeconds: number | null;

  /** Arabic speech-to-text transcription accuracy percentage (0-100) */
  readonly transcriptionAccuracyPercent: number | null;

  /** Reduction in dispatch lead time percentage (0-100) */
  readonly dispatchTimeReductionPercent: number | null;

  /** System concurrent call handling capacity */
  readonly concurrentCallCapacity: number | null;

  /** Average incident logging time in seconds */
  readonly incidentLoggingTimeSeconds: number | null;

  /** Automated priority classification accuracy percentage (0-100) */
  readonly classificationAccuracyPercent: number | null;

  /** GIS location triangulation precision radius in meters */
  readonly locationTriangulationRadiusMeters: number | null;
}

export const metrics: SystemMetrics = {
  // 122 is the established national emergency hotline number of the Egyptian Police
  hotlineShortCode: 122,

  // Benchmark metrics default to null until empirical field evaluation is provided
  callAnswerTimeSeconds: null,
  transcriptionAccuracyPercent: null,
  dispatchTimeReductionPercent: null,
  concurrentCallCapacity: null,
  incidentLoggingTimeSeconds: null,
  classificationAccuracyPercent: null,
  locationTriangulationRadiusMeters: null,
};

/**
 * Helper utility to safely format a metric value or return null
 */
export function formatMetric(
  value: number | null,
  suffix = ""
): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return `${value}${suffix}`;
}
