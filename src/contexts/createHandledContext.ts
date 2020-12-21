import {createContext, useContext} from "react";

export const createHandledContext = <ContextType>(defaultValue?: ContextType) => {
  const Context = createContext<ContextType | undefined>(defaultValue);

  return [Context.Provider, () => useContext(Context)] as const;
};
