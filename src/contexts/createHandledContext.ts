import {createContext, useContext} from "react";

export const createHandledContext = <ContextType>(defaultValue?: ContextType) => {
  const Context = createContext<ContextType | undefined>(defaultValue);
  const useHandledContext = () => {
    const ctx = useContext(Context);
    if (ctx === undefined) {
      throw new Error("Consuming context must be inside a Provider with a value");
    }
    return ctx;
  };

  return [Context.Provider, useHandledContext] as const;
};
