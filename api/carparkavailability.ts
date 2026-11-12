import type { Request, Response } from 'express';

const LTA_CARPARK_URL = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';

/**
 * Serverless handler to fetch real-time carpark availability from LTA DataMall v2
 * Endpoint: https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
 * Required header: AccountKey: <LTA_ACCOUNT_KEY>
 */
export default async function handler(req: Request, res: Response) {
  // CORS headers for serverless environment
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, AccountKey');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const accountKey = process.env.LTA_ACCOUNT_KEY;

  if (!accountKey || accountKey.trim() === '' || accountKey === 'MY_LTA_ACCOUNT_KEY') {
    // If key not configured, inform the client or provide Data.gov.sg fallback
    try {
      const fallbackRes = await fetch('https://api.data.gov.sg/v1/transport/carpark-availability');
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        return res.status(200).json({
          status: 'warning',
          message: 'LTA_ACCOUNT_KEY is not configured in environment variables. Serving Data.gov.sg live fallback data.',
          source: 'datagovsg-fallback',
          hasAccountKey: false,
          value: fallbackData.items?.[0]?.carpark_data || [],
          timestamp: fallbackData.items?.[0]?.timestamp || new Date().toISOString(),
        });
      }
    } catch {
      // Fallback failed
    }

    return res.status(401).json({
      status: 'error',
      message: 'Missing LTA_ACCOUNT_KEY environment variable. Please configure your AccountKey in .env.',
      endpoint: LTA_CARPARK_URL,
      hasAccountKey: false,
    });
  }

  try {
    const url = new URL(LTA_CARPARK_URL);
    const skip = req.query?.$skip;
    if (skip && typeof skip === 'string') {
      url.searchParams.append('$skip', skip);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        status: 'error',
        message: `LTA DataMall API error: HTTP ${response.status}`,
        details: errorText,
      });
    }

    const data = await response.json();
    return res.status(200).json({
      status: 'success',
      source: 'lta-datamall',
      hasAccountKey: true,
      totalCount: Array.isArray(data.value) ? data.value.length : 0,
      value: data.value || [],
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to connect to LTA DataMall service.',
      details: error?.message || 'Unknown network error',
    });
  }
}
