import{useEffect,useState}from'react';import type{Recipe}from'../game/cooking';import{recipeSequence,cookingAccuracy,cookingQuality,type CookingQuality}from'../game/minigames/cooking-tap';import{ingredientVisual}from'../game/ingredient-visual';import{ingredientNames,type IngredientId}from'../game/exploration';
// Cooking used to resolve on a single tap. This gives it the same shape
// as the other minigames (adventure timing games, magic's rune memory):
// memorize the recipe's own ingredient order, then tap it back into the
// pot — reusing adventure.css's overlay/card language so it doesn't
// introduce a third visual system.
export function CookingGame({recipe,onComplete,onCancel}:{recipe:Recipe;onComplete:(quality:CookingQuality)=>void;onCancel:()=>void}){
 const target=recipeSequence(recipe);
 const palette=Array.from(new Set(target));
 const[phase,setPhase]=useState<'intro'|'memorize'|'input'|'result'>('intro');
 const[shown,setShown]=useState(0);
 const[input,setInput]=useState<IngredientId[]>([]);
 const[quality,setQuality]=useState<CookingQuality>('NORMAL');
 useEffect(()=>{
  if(phase!=='memorize')return;
  setShown(0);
  const timers:number[]=[];
  target.forEach((_,i)=>timers.push(window.setTimeout(()=>setShown(i+1),480*(i+1))));
  timers.push(window.setTimeout(()=>setPhase('input'),480*target.length+250));
  return()=>timers.forEach(clearTimeout);
 },[phase]);
 const tap=(id:IngredientId)=>{
  if(phase!=='input')return;
  const next=[...input,id];
  setInput(next);
  if(next.length>=target.length){
   const accuracy=cookingAccuracy(target,next),q=cookingQuality(accuracy);
   setQuality(q);
   setPhase('result');
  }
 };
 return <div className="adventure-overlay theme-cooking"><section className="adventure-card">
  {phase==='intro'&&<>
   <small>COOKING · {recipe.name}</small>
   <h2>{recipe.name}</h2>
   <p>{recipe.description}</p>
   <div className="adventure-rule-strip">{Object.entries(recipe.ingredients).map(([id,count])=>{const v=ingredientVisual[id as IngredientId];return <span key={id}>{v.glyph} {ingredientNames[id as IngredientId]} ×{count}</span>})}</div>
   <p>재료가 나타나는 순서를 기억했다가 솥에 그대로 넣어주세요.</p>
   <button className="adventure-primary" onClick={()=>setPhase('memorize')}>요리 시작</button>
   <button className="adventure-ghost" onClick={onCancel}>돌아가기</button>
  </>}
  {phase==='memorize'&&<>
   <header><b>{recipe.name}</b><span>기억하세요</span></header>
   <div className="cooking-memorize-row">{target.map((id,i)=>{const v=ingredientVisual[id];return <span key={i} className={`cooking-memorize-slot${shown>i?' is-lit':''}`}>{shown>i?v.glyph:'?'}</span>})}</div>
  </>}
  {phase==='input'&&<>
   <header><b>{recipe.name}</b><span>{input.length}/{target.length}</span></header>
   <p>순서대로 솥에 넣어주세요</p>
   <div className="cooking-memorize-row">{target.map((_,i)=>{const filled=input[i];const v=filled?ingredientVisual[filled]:null;return <span key={i} className={`cooking-memorize-slot${v?' is-lit':''}`}>{v?v.glyph:'·'}</span>})}</div>
   <div className="cooking-palette">{palette.map(id=>{const v=ingredientVisual[id];return <button key={id} className={`cooking-palette-item tone-${v.tone}`} onClick={()=>tap(id)}><b>{v.glyph}</b><small>{ingredientNames[id]}</small></button>})}</div>
  </>}
  {phase==='result'&&<>
   <small>COOKING RESULT</small>
   <div className={`adventure-grade grade-${quality==='PERFECT'?'S':quality==='GOOD'?'A':'C'}`}>{quality}</div>
   <h2>{recipe.name} 완성!</h2>
   <p>{quality==='PERFECT'?'완벽한 손놀림! 효과가 크게 강화되었어요.':quality==='GOOD'?'좋은 솜씨예요!':'조금 서툴렀지만 완성은 했어요.'}</p>
   <button className="adventure-primary" onClick={()=>onComplete(quality)}>루나에게 대접하기</button>
  </>}
 </section></div>;
}
