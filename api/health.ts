import type { Request, Response } from 'express';

/**
 * Health check serverless endpoint
 * Path: /api/health
 */
export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const hasLtaKey = Boolean(
    process.env.LTA_ACCOUNT_KEY &&
    process.env.LTA_ACCOUNT_KEY.trim() !== '' &&
    process.env.LTA_ACCOUNT_KEY !== 'MY_LTA_ACCOUNT_KEY'
  );

  return res.status(200).json({
    status: 'ok',
    service: 'SG Carpark Live API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    ltaDataMall: {
      accountKeyConfigured: hasLtaKey,
      carparkEndpoint: 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2',
      headerRequired: 'AccountKey',
    },
  });
}
