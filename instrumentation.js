export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-grpc');
    const { Resource } = await import('@opentelemetry/resources');

    const sdk = new NodeSDK({
      resource: new Resource({
        'service.name': process.env.OTEL_SERVICE_NAME || 'nextjs-demo',
        'service.version': process.env.OTEL_SERVICE_VERSION || '1.0.0',
      }),
      traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
      }),
      instrumentations: [getNodeAutoInstrumentations()],
    });

    sdk.start();
    console.log(`OTel SDK started via instrumentation hook → ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}`);
  }
}
