import { GameApp, useGameState } from './App';
import LayeredHome from './LayeredHome';
import { ProgressRibbon } from './components/ProgressRibbon';
import './layered-home.css';
import './home-panels.css';
export default function Root(){const{state,dispatch}=useGameState();const showHome=state.screen==='hub';return <><GameApp state={state} dispatch={dispatch} renderHub={!showHome}/>{showHome&&<><LayeredHome state={state} onSchedule={()=>dispatch({type:'GO',screen:'schedule'})}/><ProgressRibbon state={state}/></>}</>}
