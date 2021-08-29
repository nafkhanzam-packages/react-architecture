import React, {PropsWithChildren, Provider, useCallback, useEffect, useMemo, useState} from "react";
import {AsyncData} from "../types";

type Action<LoggedType> = {
  login: (logged: LoggedType) => Promise<void>;
  logout: () => void;
};

export type AuthContext<LoggedType, ContextType> = {
  actions: Action<LoggedType>;
  logged: AsyncData<LoggedType | null>;
  context: ContextType;
};

export const AuthProvider = <LoggedType, ContextType>(
  props: PropsWithChildren<{
    BaseAuthProvider: Provider<AuthContext<LoggedType, ContextType> | undefined>;
    getSavedLogged: (ctx: ContextType) => Promise<LoggedType | null>;
    saveLogged: (logged: LoggedType) => Promise<void>;
    onLogout: () => Promise<void>;
    onError?: (err: unknown) => void;
    getContext: (logged: AsyncData<LoggedType | null>) => ContextType;
  }>,
) => {
  const [logged, setLogged] = useState<AsyncData<LoggedType | null>>({
    status: "loading",
  });

  const login = useCallback(
    async (newLogged: LoggedType) => {
      await props.saveLogged(newLogged);
      setLogged({
        status: "success",
        data: newLogged,
      });
    },
    [props],
  );

  const logout = useCallback(async () => {
    await props.onLogout();
    setLogged({
      status: "success",
      data: null,
    });
  }, [props]);

  const contextInstance = useMemo(() => props.getContext(logged), [logged, props]);

  useEffect(() => {
    (async () => {
      try {
        const retrievedLogged = await props.getSavedLogged(contextInstance);
        setLogged({
          status: "success",
          data: retrievedLogged,
        });
      } catch (err: unknown) {
        setLogged({
          status: "error",
          error: err,
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actions: Action<LoggedType> = {login, logout};
  const context: AuthContext<LoggedType, ContextType> = {
    actions,
    logged,
    context: contextInstance,
  };

  return <props.BaseAuthProvider value={context}>{props.children}</props.BaseAuthProvider>;
};
