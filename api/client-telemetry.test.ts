import {afterEach,describe,expect,it,vi} from 'vitest';
import handler from './client-telemetry';

type MockResponse={statusCode:number;body:unknown;ended:boolean;status:(code:number)=>MockResponse;json:(body:unknown)=>MockResponse;end:()=>MockResponse};
function response():MockResponse{
  return {
    statusCode:200,body:undefined,ended:false,
    status(code){this.statusCode=code;return this;},
    json(body){this.body=body;this.ended=true;return this;},
    end(){this.ended=true;return this;},
  };
}

afterEach(()=>vi.restoreAllMocks());

describe('/api/client-telemetry',()=>{
  it('serves a GET health check',async()=>{
    const res=response();
    await handler({method:'GET'},res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ok:true});
  });

  it('rejects unsupported methods',async()=>{
    const res=response();
    await handler({method:'PUT'},res);
    expect(res.statusCode).toBe(405);
  });

  it('rejects invalid POST payloads without logging them',async()=>{
    const info=vi.spyOn(console,'info').mockImplementation(()=>undefined);
    const error=vi.spyOn(console,'error').mockImplementation(()=>undefined);
    const res=response();
    await handler({method:'POST',body:{kind:'render_error',phase:'error_boundary',path:'/',message:'private'}},res);
    expect(res.statusCode).toBe(400);
    expect(info).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it('logs valid performance samples at info level',async()=>{
    const info=vi.spyOn(console,'info').mockImplementation(()=>undefined);
    const res=response();
    await handler({method:'POST',body:{kind:'client_perf',phase:'navigation',path:'/',metric:'load_ms',value:250}},res);
    expect(res.statusCode).toBe(204);
    expect(info).toHaveBeenCalledTimes(1);
    expect(String(info.mock.calls[0][0])).toContain('puppy_maker_client_telemetry');
  });

  it('logs valid fault events at error level',async()=>{
    const error=vi.spyOn(console,'error').mockImplementation(()=>undefined);
    const res=response();
    await handler({method:'POST',body:{kind:'save_error',phase:'write',path:'/'}},res);
    expect(res.statusCode).toBe(204);
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toContain('puppy_maker_client_telemetry');
  });
});
