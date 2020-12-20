import {DependencyList, ReactElement, useCallback, useEffect, useRef, useState} from "react";

enum Status {
  LOADING,
  ERROR,
  DONE,
}

type Options = {
  loadingComponent?: ComponentType;
  errorComponent?: ComponentType;
};

type ComponentType = ReactElement;
type GetComponentType = (
  status: Status,
  doneComponent: ComponentType | null,
  opts?: Options,
) => ComponentType;

type AsyncReturnType = [ComponentType, () => Promise<void>];
type SyncReturnType = [ComponentType, () => void];

export const useAsync = (props: {
  callback: () => Promise<ComponentType | null>;
  phase: ComponentPhase;
  deps: DependencyList;
  opts?: Options;
}): AsyncReturnType => {
  const [component, setComponent] = useState<ComponentType | null>(null);
  const [status, setStatus] = useState(Status.LOADING);
  const refreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) {
      return;
    }
    try {
      refreshingRef.current = true;
      setStatus(Status.LOADING);
      const comp = await props.callback();
      setStatus(Status.DONE);
      setComponent(comp);
    } catch (err) {
      props.phase.onError(err);
      setStatus(Status.ERROR);
    } finally {
      refreshingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, props.deps);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return [props.phase.getComponent(status, component, props.opts), refresh];
};

export const useSync = (props: {
  callback: () => ComponentType;
  phase: ComponentPhase;
  deps: DependencyList;
  opts?: Options;
}): SyncReturnType => {
  const load = useCallback(() => {
    try {
      const comp = props.callback();
      return props.phase.getComponent(Status.DONE, comp, props.opts);
    } catch (err) {
      props.phase.onError(err);
      return props.phase.getComponent(Status.ERROR, null, props.opts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, props.deps);

  const [comp, setComp] = useState(load());

  return [comp, () => setComp(load())];
};

export class ComponentPhase {
  constructor(
    private defaults: {
      loadingComponent: ComponentType;
      errorComponent: ComponentType;
      onError?: (err: unknown) => void;
    },
  ) {}

  getComponent: GetComponentType = (status, doneComponent, opts) => {
    if (status === Status.LOADING || (status === Status.DONE && doneComponent === null)) {
      return opts?.loadingComponent ?? this.defaults.loadingComponent;
    } else if (status === Status.ERROR || doneComponent === null) {
      return opts?.errorComponent ?? this.defaults.errorComponent;
    } else {
      return doneComponent;
    }
  };

  onError(err: unknown) {
    if (this.defaults.onError) {
      this.defaults.onError(err);
    } else {
      console.error(err);
    }
  }
}
