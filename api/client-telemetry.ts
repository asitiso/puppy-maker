import {parseClientTelemetryPayload} from '../src/client-telemetry-contract';

type TelemetryRequest = {method?:string;body?:unknown};
type TelemetryResponse = {
  status:(code:number)=>TelemetryResponse;
  json:(body:unknown)=>TelemetryResponse;
  end:()=>TelemetryResponse;
};

export default async function handler(req:TelemetryRequest,res:TelemetryResponse):Promise<void>{
  if (req.method === 'GET') {
    res.status(200).json({ok:true});
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const payload = parseClientTelemetryPayload(req.body);
  if (!payload) {
    res.status(400).end();
    return;
  }

  const entry = JSON.stringify({event:'puppy_maker_client_telemetry',...payload});
  if (payload.kind === 'client_perf') console.info(entry);
  else console.error(entry);
  res.status(204).end();
}
