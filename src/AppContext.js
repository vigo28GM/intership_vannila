import { createContext, useContext } from 'react';

// Viss, ko vajag vairākiem komponentiem (lietotājs, ieraksti, paziņojumi…),
// tiek nodots caur šo kontekstu, nevis cauri katram komponentam ar props.
export const AppContext = createContext(null);

export function useApp() {
    return useContext(AppContext);
}
