import{useState,type Dispatch}from'react';import{GameApp}from'./App';import LayeredHome from'./LayeredHome';import{ProgressRibbon}from'./components/ProgressRibbon';import{WorldHub}from'./components/WorldHub';import{CampaignSummary}from'./components/CampaignSummary';import{useWorldGameState}from'./game/use-world-game';import{wardrobe}from'./game/wardrobe';import type{Action}from'./game';import'./layered-home.css';import'./home-panels.css';import'./world-hub.css';import'./campaign-summary.css';import'./adventure.css';export default function Root(){const{state,dispatch}=useWorldGameState();const showHome=state.screen==='hub';const baseDispatch=dispatch as Dispatch<Action>;const schedule=()=>dispatch({type:'GO',screen:'schedule'});const equippedLabel=wardrobe.find(item=>item.id===state.equippedWardrobe)?.name;const[collectionSignal,setCollectionSignal]=useState(0);const openCollection=()=>setCollectionSignal(n=>n+1);
// LayeredHome/ProgressRibbon/CampaignSummary/WorldHub used to render as
// siblings of <GameApp>'s <main className="page">, i.e. outside
// .game-shell entirely. .layered-home is `position:absolute;inset:0`
// with no positioned ancestor above it (.page/body/html are all
// position:static), so its inset:0 resolved against the *viewport*, not
// the mobile-shell box — on any window wider/taller than the shell, the
// whole home screen (level badge, character, nav) sprawled across the
// full browser window instead of staying inside the shell frame. Passed
// in as GameApp's `overlay` instead so it renders inside .game-shell
// (which *is* position:relative + overflow:hidden), matching exactly
// where the shell itself is drawn.
const bond=()=>state.monthlyBondActions<3&&dispatch({type:'BOND'});const overlay=showHome&&<><LayeredHome state={state} onSchedule={schedule} equippedLabel={equippedLabel} onBond={bond} onOpenDressing={openCollection}/><ProgressRibbon state={state}/><CampaignSummary state={state} onSchedule={schedule}/><WorldHub state={state} dispatch={dispatch} openSignal={collectionSignal} openTab="collection"/></>;
return <GameApp state={state} dispatch={baseDispatch} renderHub={!showHome} overlay={overlay}/>}
