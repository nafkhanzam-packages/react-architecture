import React from "react";
import {ReactNode} from "react";

export const ConditionalWrap: React.FC<{
  condition: unknown;
  wrapper: (children: ReactNode) => ReactNode;
}> = ({condition, wrapper, children}) => <>{condition ? wrapper(children) : children}</>;
