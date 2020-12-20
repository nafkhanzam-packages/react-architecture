import {createHandledContext} from "./createHandledContext";
import {AuthProvider, Context} from "./BaseAuthContext";

type ContextType = {token: string};

const [BaseStringAuthProvider, useStringAuthContext] = createHandledContext<Context<ContextType>>();

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
