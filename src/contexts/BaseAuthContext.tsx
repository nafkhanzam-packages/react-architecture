import {PropsWithChildren, Provider, useCallback, useEffect, useState} from "react";

type Action<LoggedType> = {
  login: (logged: LoggedType) => Promise<void>;
  logout: () => void;
};

export type Context<LoggedType> = {
  actions: Action<LoggedType>;
  logged: LoggedType | null;
};

export const AuthProvider = <LoggedType,>(
  props: PropsWithChildren<{
    BaseAuthProvider: Provider<Context<LoggedType> | undefined>;
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

  const context: Context<LoggedType> = {actions, logged};

  return (
    <props.BaseAuthProvider key="AuthContext" value={context}>
      {props.children}
    </props.BaseAuthProvider>
  );
};
