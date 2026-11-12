import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const LTA_BASE_URL = 'https://datamall2.mytransport.sg/ltaodataservice';

/**
 * Generic helper to query LTA DataMall with AccountKey header
 */
async function fetchLtaDataMall(endpoint: string, queryParams: Record<string, string | undefined> = {}) {
  const accountKey = process.env.LTA_ACCOUNT_KEY;

  if (!accountKey || accountKey === 'MY_LTA_ACCOUNT_KEY') {
    throw new Error('MISSING_KEY');
  }

  const url = new URL(`${LTA_BASE_URL}/${endpoint}`);
  Object.entries(queryParams).forEach(([key, val]) => {
    if (val !== undefined && val !== '') {
      url.searchParams.append(key, val);
    }
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      AccountKey: accountKey,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    const err = new Error(`LTA API HTTP ${response.status}: ${errorText}`);
    (err as any).statusCode = response.status;
    throw err;
  }

  return response.json();
}

// -------------------------------------------------------------
// 1. Live Carpark Lots (HDB, LTA and URA)
// Endpoint: https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
// -------------------------------------------------------------
app.get('/api/lta/carparks', async (req: Request, res: Response) => {
  const skip = (req.query.$skip as string) || '';

  try {
    const ltaData = await fetchLtaDataMall('CarParkAvailabilityv2', {
      $skip: skip || undefined,
    });
    return res.json({
      success: true,
      source: 'lta-datamall',
      hasAccountKey: true,
      totalCount: Array.isArray(ltaData.value) ? ltaData.value.length : 0,
      value: ltaData.value || [],
    });
  } catch (err: any) {
    // If LTA_ACCOUNT_KEY is not configured or fails auth, fallback cleanly to Data.gov.sg
    console.warn(`[LTA API] Carpark fetch notice (${err.message}). Connecting to public live stream.`);
    try {
      const govRes = await fetch('https://api.data.gov.sg/v1/transport/carpark-availability');
      if (govRes.ok) {
        const govData = await govRes.json();
        return res.json({
          success: true,
          source: 'datagovsg-fallback',
          hasAccountKey: Boolean(process.env.LTA_ACCOUNT_KEY && process.env.LTA_ACCOUNT_KEY !== 'MY_LTA_ACCOUNT_KEY'),
          message: err.message === 'MISSING_KEY' 
            ? 'Running via Data.gov.sg fallback. Configure LTA_ACCOUNT_KEY in .env for direct LTA DataMall v2 stream.'
            : `LTA DataMall responded with ${err.message}. Using Data.gov.sg live stream.`,
          timestamp: govData.items?.[0]?.timestamp || new Date().toISOString(),
          value: govData.items?.[0]?.carpark_data || [],
        });
      }
    } catch {
      // In case both are unreachable
    }

    return res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
      hasAccountKey: Boolean(process.env.LTA_ACCOUNT_KEY && process.env.LTA_ACCOUNT_KEY !== 'MY_LTA_ACCOUNT_KEY'),
    });
  }
});

// -------------------------------------------------------------
// 2. Next buses at a stop (v3, refreshes every 20 seconds)
// Endpoint: https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=04121 (&ServiceNo=7)
// -------------------------------------------------------------
app.get('/api/lta/bus-arrival', async (req: Request, res: Response) => {
  const busStopCode = (req.query.BusStopCode as string) || '04121'; // Default: Bras Basah Rd / City Hall area
  const serviceNo = (req.query.ServiceNo as string) || '';

  try {
    const ltaData = await fetchLtaDataMall('v3/BusArrival', {
      BusStopCode: busStopCode,
      ServiceNo: serviceNo || undefined,
    });
    return res.json({
      success: true,
      source: 'lta-datamall',
      hasAccountKey: true,
      data: ltaData,
    });
  } catch (err: any) {
    // Return simulated arrival data for UI completeness if key is not configured
    const now = new Date();
    const nextArr1 = new Date(now.getTime() + 4 * 60000).toISOString();
    const nextArr2 = new Date(now.getTime() + 12 * 60000).toISOString();
    const nextArr3 = new Date(now.getTime() + 21 * 60000).toISOString();

    return res.json({
      success: true,
      source: 'simulated-fallback',
      hasAccountKey: false,
      message: 'Configure LTA_ACCOUNT_KEY in .env for live LTA bus stream.',
      data: {
        BusStopCode: busStopCode,
        Services: [
          {
            ServiceNo: serviceNo || '7',
            Operator: 'SBST',
            NextBus: { EstimatedArrival: nextArr1, Load: 'SEA', Feature: 'WAB', Type: 'DD' },
            NextBus2: { EstimatedArrival: nextArr2, Load: 'SDA', Feature: 'WAB', Type: 'SD' },
            NextBus3: { EstimatedArrival: nextArr3, Load: 'LSD', Feature: 'WAB', Type: 'DD' },
          },
          {
            ServiceNo: '14',
            Operator: 'SBST',
            NextBus: { EstimatedArrival: new Date(now.getTime() + 2 * 60000).toISOString(), Load: 'SEA', Feature: 'WAB', Type: 'DD' },
            NextBus2: { EstimatedArrival: new Date(now.getTime() + 9 * 60000).toISOString(), Load: 'SEA', Feature: 'WAB', Type: 'SD' },
            NextBus3: { EstimatedArrival: new Date(now.getTime() + 18 * 60000).toISOString(), Load: 'SEA', Feature: 'WAB', Type: 'DD' },
          },
          {
            ServiceNo: '106',
            Operator: 'TTS',
            NextBus: { EstimatedArrival: new Date(now.getTime() + 6 * 60000).toISOString(), Load: 'SDA', Feature: 'WAB', Type: 'DD' },
            NextBus2: { EstimatedArrival: new Date(now.getTime() + 15 * 60000).toISOString(), Load: 'SEA', Feature: 'WAB', Type: 'DD' },
            NextBus3: { EstimatedArrival: new Date(now.getTime() + 24 * 60000).toISOString(), Load: 'SEA', Feature: 'WAB', Type: 'SD' },
          },
        ],
      },
    });
  }
});

// -------------------------------------------------------------
// 3. Traffic Incidents
// Endpoint: https://datamall2.mytransport.sg/ltaodataservice/TrafficIncidents
// -------------------------------------------------------------
app.get('/api/lta/traffic-incidents', async (_req: Request, res: Response) => {
  try {
    const ltaData = await fetchLtaDataMall('TrafficIncidents');
    return res.json({
      success: true,
      source: 'lta-datamall',
      hasAccountKey: true,
      value: ltaData.value || [],
    });
  } catch (err: any) {
    // Return sample incidents for drivers
    return res.json({
      success: true,
      source: 'simulated-fallback',
      hasAccountKey: false,
      message: 'Configure LTA_ACCOUNT_KEY in .env for live LTA incidents.',
      value: [
        {
          Type: 'Roadwork',
          Latitude: 1.332,
          Longitude: 103.856,
          Message: 'Roadwork on CTE (towards AYE) after Braddell Rd Exit. Lane 2 closed.',
        },
        {
          Type: 'Heavy Traffic',
          Latitude: 1.284,
          Longitude: 103.858,
          Message: 'Heavy traffic on Bayfront Avenue towards Marina Bay Sands. Expect 5-10 min delay.',
        },
        {
          Type: 'Vehicle Breakdown',
          Latitude: 1.353,
          Longitude: 103.942,
          Message: 'Breakdown on PIE (towards Changi) before Tampines Ave 5 Exit.',
        },
      ],
    });
  }
});

// -------------------------------------------------------------
// 4. Train Service Alerts (MRT/LRT)
// Endpoint: https://datamall2.mytransport.sg/ltaodataservice/TrainServiceAlerts
// -------------------------------------------------------------
app.get('/api/lta/train-alerts', async (_req: Request, res: Response) => {
  try {
    const ltaData = await fetchLtaDataMall('TrainServiceAlerts');
    return res.json({
      success: true,
      source: 'lta-datamall',
      hasAccountKey: true,
      data: ltaData.value || { Status: 1, Message: [] },
    });
  } catch (err: any) {
    return res.json({
      success: true,
      source: 'simulated-fallback',
      hasAccountKey: false,
      message: 'Configure LTA_ACCOUNT_KEY in .env for live LTA MRT alerts.',
      data: {
        Status: 1, // 1 = Normal, 2 = Disrupted
        Line: '',
        Direction: '',
        Stations: '',
        FreePublicBus: '',
        FreeMRTShuttle: '',
        Message: [],
      },
    });
  }
});

// -------------------------------------------------------------
// 5. LTA DataMall Connection Status Check
// -------------------------------------------------------------
app.get('/api/lta/status', async (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.LTA_ACCOUNT_KEY && process.env.LTA_ACCOUNT_KEY !== 'MY_LTA_ACCOUNT_KEY');
  let isConnected = false;
  let testError: string | null = null;

  if (hasKey) {
    try {
      await fetchLtaDataMall('CarParkAvailabilityv2', { $skip: '0' });
      isConnected = true;
    } catch (err: any) {
      testError = err.message;
    }
  }

  return res.json({
    hasAccountKey: hasKey,
    isConnected,
    testError,
    activeEndpoints: [
      'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2',
      'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival',
      'https://datamall2.mytransport.sg/ltaodataservice/TrafficIncidents',
      'https://datamall2.mytransport.sg/ltaodataservice/TrainServiceAlerts',
    ],
  });
});

// -------------------------------------------------------------
// Vite Middleware / Production Static Server
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SG Carpark Live Server] Running at http://localhost:${PORT} in ${isProd ? 'production' : 'development'} mode.`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
