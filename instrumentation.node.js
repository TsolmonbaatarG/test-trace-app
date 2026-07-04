'use strict';

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-grpc');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { Resource } = require('@opentelemetry/resources');
const { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } = require('@opentelemetry/semantic-conventions');

// OTel endpoint — K8s node IP эсвэл DaemonSet service
const OTEL_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317';
const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'nextjs-demo';
const SERVICE_VERSION = process.env.OTEL_SERVICE_VERSION || '1.0.0';

const sdk = new NodeSDK({
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: SERVICE_NAME,
    [SEMRESATTRS_SERVICE_VERSION]: SERVICE_VERSION,
    'deployment.environment': process.env.NODE_ENV || 'development',
    'k8s.namespace': process.env.K8S_NAMESPACE || 'default',
    'k8s.pod.name': process.env.K8S_POD_NAME || 'unknown',
  }),

  // Trace exporter → SigNoz (Developer) эсвэл Alloy (SRE)
  traceExporter: new OTLPTraceExporter({
    url: OTEL_ENDPOINT,
  }),

  // Metric exporter
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: OTEL_ENDPOINT,
    }),
    exportIntervalMillis: 30000,
  }),

  // Auto instrumentation — HTTP, fetch, DNS гэх мэт
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        ignoreIncomingRequestHook: (req) => {
          // Health check trace хасах
          return req.url === '/api/health' || req.url === '/favicon.ico';
        },
      },
      '@opentelemetry/instrumentation-dns': { enabled: true },
      '@opentelemetry/instrumentation-express': { enabled: true },
    }),
  ],
});

sdk.start();
console.log(`OTel SDK started → ${OTEL_ENDPOINT} (${SERVICE_NAME})`);

process.on('SIGTERM', () => {
  sdk.shutdown().then(() => console.log('OTel SDK shutdown')).catch(console.error);
});
