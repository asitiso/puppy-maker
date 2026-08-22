export const isV3Record=(value:unknown):value is Record<string,unknown>=>
  typeof value==='object'&&value!==null&&!Array.isArray(value);

export function safeNonNegativeInt(value:unknown,fallback=0):number{
  return typeof value==='number'&&Number.isFinite(value)&&value>=0?Math.floor(value):fallback;
}

export function safePositiveInt(value:unknown,fallback=1):number{
  const safe=safeNonNegativeInt(value,0);
  return safe>=1?safe:fallback;
}

export function uniqueRegistered<T extends string>(raw:unknown,ids:readonly T[]):T[]{
  if(!Array.isArray(raw))return [];
  return ids.filter(id=>raw.includes(id));
}

export function safeOptionalString(value:unknown):string|null{
  if(typeof value!=='string')return null;
  const trimmed=value.trim();
  return trimmed.length?trimmed:null;
}
