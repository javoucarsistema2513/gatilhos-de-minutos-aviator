export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'ok',
    service: 'calculo-aviator-api',
    platform: 'vercel-serverless',
    timestamp: new Date().toISOString(),
  });
}
