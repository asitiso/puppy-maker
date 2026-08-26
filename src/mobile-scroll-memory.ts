const mobileScrollPositions=new Map<string,number>();

export function rememberMobileScroll(key:string,top:number){
  if(!key)return;
  const safe=Number.isFinite(top)?Math.max(0,top):0;
  mobileScrollPositions.set(key,safe);
}

export function readMobileScroll(key:string):number{
  if(!key)return 0;
  return mobileScrollPositions.get(key)??0;
}

export function forgetMobileScroll(key:string){
  mobileScrollPositions.delete(key);
}

export function clearMobileScrollMemory(){
  mobileScrollPositions.clear();
}
