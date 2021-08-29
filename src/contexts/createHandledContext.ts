import {createContext, useContext} from "react";

export const createHandledContext = <ContextType>(defaultValue?: ContextType) => {
  const Context = createContext<ContextType | undefined>(defaultValue);

  return [Context.Provider, () => useContext(Context)] as const;
};

export const createNonNullContext = <ContextType>(defaultValue?: ContextType) => {
  const Context = createContext<ContextType | undefined>(defaultValue);

  return [
    Context.Provider,
    () => {
      const value = useContext(Context);
      if (value === undefined) {
        throw new Error("Context called but undefined received!");
      }
      return value;
    },
  ] as const;
};
