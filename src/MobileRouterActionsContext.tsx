import {createContext,useContext,type ReactNode} from 'react';

type MobileRouterActions={onBack:()=>void;onHome:()=>void};

const noop=()=>undefined;
const MobileRouterActionsContext=createContext<MobileRouterActions>({onBack:noop,onHome:noop});

export function MobileRouterActionsProvider({onBack,onHome,children}:MobileRouterActions&{children:ReactNode}){
  return <MobileRouterActionsContext.Provider value={{onBack,onHome}}>{children}</MobileRouterActionsContext.Provider>;
}

export function useMobileRouterActions(){return useContext(MobileRouterActionsContext);}
