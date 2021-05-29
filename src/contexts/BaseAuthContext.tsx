import React, {PropsWithChildren, Provider, useCallback, useEffect, useMemo, useState} from "react";
import {ComponentPhase} from "../ComponentPhase";

type Action<LoggedType> = {
  login: (logged: LoggedType) => Promise<void>;
  logout: () => void;
};

export type AuthContext<LoggedType, ContextType> = {
  actions: Action<LoggedType>;
  logged: LoggedType | null;
  context: ContextType;
  mounted: boolean;
};

export type LoggedAuthContext<LoggedType, ContextType> = AuthContext<LoggedType, ContextType> & {
  logged: LoggedType;
};

export type AuthFC<LoggedType, ContextType, Props> = React.FC<
  {auth: AuthContext<LoggedType, ContextType>} & Props
>;
export type LoggedAuthFC<LoggedType, ContextType, Props> = React.FC<
  {auth: LoggedAuthContext<LoggedType, ContextType>} & Props
>;

export const AuthProvider = <LoggedType, ContextType>(
  props: PropsWithChildren<{
    BaseAuthProvider: Provider<AuthContext<LoggedType, ContextType> | undefined>;
    getSavedLogged: (ctx: ContextType) => Promise<LoggedType | null>;
    saveLogged: (logged: LoggedType) => Promise<void>;
    onLogout: () => Promise<void>;
    onError?: (err: unknown) => void;
    getContext: (logged: LoggedType | null) => ContextType;
  }>,
) => {
  const [logged, setLogged] = useState<LoggedType | null>(null);
  const [mounted, setMounted] = useState(false);

  const login = useCallback(
    async (newLogged: LoggedType) => {
      await props.saveLogged(newLogged);
      setLogged(newLogged);
      if (!mounted) {
        setMounted(true);
      }
    },
    [mounted, props],
  );

  const logout = useCallback(async () => {
    await props.onLogout();
    setLogged(null);
    if (!mounted) {
      setMounted(true);
    }
  }, [mounted, props]);

  const contextInstance = useMemo(() => props.getContext(logged), [logged, props]);

  useEffect(() => {
    (async () => {
      try {
        const retrievedLogged = await props.getSavedLogged(contextInstance);
        if (retrievedLogged) {
          setLogged(retrievedLogged);
        }
      } catch (err: unknown) {
        await logout();
      }
      setMounted(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actions: Action<LoggedType> = {login, logout};
  const context: AuthContext<LoggedType, ContextType> = {
    actions,
    logged,
    context: contextInstance,
    mounted,
  };

  return <props.BaseAuthProvider value={context}>{props.children}</props.BaseAuthProvider>;
};

export const createWithAuthContextWrapper = <LoggedType, ContextType>(
  phase: ComponentPhase,
  useAuthContext: () => AuthContext<LoggedType, ContextType> | undefined,
) => <Props,>(Component: AuthFC<LoggedType, ContextType, Props>): React.FC<Props> => (props) => {
  const authContext = useAuthContext();

  const [comp] = phase.useSync(() => {
    if (!authContext?.mounted) {
      return null;
    }
    return <Component auth={authContext} {...props} />;
  }, [authContext]);

  return comp;
};

export const createWithLoggedAuthContextWrapper = <LoggedType, ContextType>(
  phase: ComponentPhase,
  useAuthContext: () => AuthContext<LoggedType, ContextType> | undefined,
  onNotLogged: () => Promise<void> | void,
) => <Props,>(Component: LoggedAuthFC<LoggedType, ContextType, Props>): React.FC<Props> => (
  props,
) => {
  const authContext = useAuthContext();

  const [comp] = phase.useSync(() => {
    if (!authContext?.mounted) {
      return null;
    }
    const {logged} = authContext;
    if (!logged) {
      onNotLogged();
      return null;
    }
    return <Component auth={{...authContext, logged}} {...props} />;
  }, [authContext]);

  return comp;
};
