export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'ok',
    message: 'Radar Aviator 82b AI API Serverless Engine',
    endpoints: [
      '/api/ai/analyze-chart',
      '/api/ai/chat-assistant',
      '/api/ai/forecast-analysis',
      '/api/health',
    ],
  });
}
