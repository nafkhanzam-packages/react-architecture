import {PropsWithChildren, Provider, ReactElement, useCallback, useEffect, useState} from "react";
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
    getSavedLogged: () => Promise<LoggedType>;
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
        const logged = await props.getSavedLogged();
        login(logged);
      } catch (err: unknown) {
        if (props.onError) {
          props.onError(err);
        } else {
          console.error(err);
        }
        logout();
      }
    })();
  }, [login, logout, props]);

  const actions: Action<LoggedType> = {login, logout};

  const context: AuthContext<LoggedType> = {actions, logged};

  return <props.BaseAuthProvider value={context}>{props.children}</props.BaseAuthProvider>;
};

export const createWithAuthContextWrapper = <Props extends unknown, LoggedType>(
  useAsync: ReturnType<ComponentPhase["createUseAsync"]>,
  useAuthContext: () => AuthContext<LoggedType> | undefined,
) => (Component: AuthFC<LoggedType, Props>): React.FC<Props> => (props) => {
  const authContext = useAuthContext();

  const [comp] = useAsync(async () => {
    if (!authContext) {
      return null;
    }
    return <Component auth={authContext} {...props} />;
  }, [authContext, props]);

  return comp;
};

export const createWithLoggedAuthContextWrapper = <Props extends unknown, LoggedType>(
  useAsync: ReturnType<ComponentPhase["createUseAsync"]>,
  useAuthContext: () => AuthContext<LoggedType> | undefined,
  onNotLogged: () => Promise<ReactElement | null>,
) => (Component: LoggedAuthFC<LoggedType, Props>): React.FC<Props> => (props) => {
  const authContext = useAuthContext();

  const [comp] = useAsync(async () => {
    if (!authContext) {
      return null;
    }
    const {logged} = authContext;
    if (!logged) {
      return await onNotLogged();
    }
    return <Component auth={{...authContext, logged}} {...props} />;
  }, [authContext, props]);

  return comp;
};
