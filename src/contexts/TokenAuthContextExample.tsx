import {createHandledContext} from "./createHandledContext";
import {AuthProvider, AuthContext} from "./BaseAuthContext";

type ContextType = {token: string};

const [BaseStringAuthProvider, useStringAuthContext] = createHandledContext<
  AuthContext<ContextType>
>();

export {useStringAuthContext};

export const StringAuthProvider: React.FC = (props) => {
  return (
    <AuthProvider<ContextType>
      BaseAuthProvider={BaseStringAuthProvider}
      getSavedLogged={async () => ({token: ""})}
      saveLogged={async (_logged) => {}}
      onError={console.error}>
      {props.children}
    </AuthProvider>
  );
};
