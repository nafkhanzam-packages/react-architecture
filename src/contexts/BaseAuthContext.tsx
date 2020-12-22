import React, {PropsWithChildren, Provider, useCallback, useEffect, useState} from "react";
import {ComponentPhase} from "../ComponentPhase";

type Action<LoggedType> = {
  login: (logged: LoggedType) => Promise<void>;
  logout: () => void;
};

export type AuthContext<LoggedType> = {
  actions: Action<LoggedType>;
  logged: LoggedType | null;
};

export type LoggedAuthContext<LoggedType> = {
  actions: Action<LoggedType>;
  logged: LoggedType;
};

export type AuthFC<LoggedType, Props> = React.FC<{auth: AuthContext<LoggedType>} & Props>;
export type LoggedAuthFC<LoggedType, Props> = React.FC<
  {auth: LoggedAuthContext<LoggedType>} & Props
>;

export const AuthProvider = <LoggedType,>(
  props: PropsWithChildren<{
    BaseAuthProvider: Provider<AuthContext<LoggedType> | undefined>;
    getSavedLogged: () => Promise<LoggedType | null>;
    saveLogged: (logged: LoggedType) => Promise<void>;
    onError?: (err: unknown) => void;
  }>,
) => {
  const [logged, setLogged] = useState<LoggedType | null>(null);

  const login = useCallback(
    async (logged: LoggedType) => {
      await props.saveLogged(logged);
      setLogged(logged);
    },
    [props],
  );

  const logout = useCallback(() => {
    setLogged(null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const retrievedLogged = await props.getSavedLogged();
        setLogged(retrievedLogged);
      } catch (err: unknown) {
        logout();
      }
    })();
  }, [login, logout, props]);

  const actions: Action<LoggedType> = {login, logout};
  const context: AuthContext<LoggedType> = {actions, logged};

  return <props.BaseAuthProvider value={context}>{props.children}</props.BaseAuthProvider>;
};

export const createWithAuthContextWrapper = <LoggedType,>(
  phase: ComponentPhase,
  useAuthContext: () => AuthContext<LoggedType> | undefined,
) => <Props,>(Component: AuthFC<LoggedType, Props>): React.FC<Props> => (props) => {
  const authContext = useAuthContext();

  const [comp] = phase.useAsync(async () => {
    if (!authContext) {
      return null;
    }
    return <Component auth={authContext} {...props} />;
  }, [authContext]);

  return comp;
};

export const createWithLoggedAuthContextWrapper = <LoggedType,>(
  phase: ComponentPhase,
  useAuthContext: () => AuthContext<LoggedType> | undefined,
  onNotLogged: () => Promise<void>,
) => <Props,>(Component: LoggedAuthFC<LoggedType, Props>): React.FC<Props> => (props) => {
  const authContext = useAuthContext();

  const [comp] = phase.useAsync(async () => {
    if (!authContext) {
      return null;
    }
    const {logged} = authContext;
    if (!logged) {
      await onNotLogged();
      return null;
    }
    return <Component auth={{...authContext, logged}} {...props} />;
  }, [authContext]);

  return comp;
};
