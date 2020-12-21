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

type UseAsyncArgs = Omit<Parameters<typeof useAsync>[0], "phase">;
type UseSyncArgs = Omit<Parameters<typeof useSync>[0], "phase">;

export const useAsync = (props: {
  phase: ComponentPhase;
  callback: () => Promise<ComponentType | null>;
  deps: DependencyList;
  opts?: Options;
}): AsyncReturnType => {
  const [component, setComponent] = useState<ComponentType | null>(null);
  const [status, setStatus] = useState<Status>(Status.LOADING);
  const refreshingRef = useRef(false);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (refreshingRef.current || !mountedRef.current) {
      return;
    }
    try {
      refreshingRef.current = true;
      setStatus(Status.LOADING);
      const comp = await props.callback();
      if (!mountedRef.current) {
        return;
      }
      console.log("Got component!", comp);
      setStatus(Status.DONE);
      setComponent(comp);
    } catch (err) {
      props.phase.onError(err);
      setStatus(Status.ERROR);
    } finally {
      refreshingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props, ...props.deps]);

  useEffect(() => {
    refresh();
    return () => {
      console.log("Unmounting Async!", refreshingRef.current, mountedRef.current);
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...props.deps]);

  // useEffect(() => {
  //   refreshingRef.current = false;
  //   refresh();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, props.deps);

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
  }, [props]);

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
    (this.defaults.onError ?? console.error)(err);
  }

  createUseAsync() {
    return (
      callback: UseAsyncArgs["callback"],
      deps: UseAsyncArgs["deps"],
      opts?: UseAsyncArgs["opts"],
    ) =>
      useAsync({
        callback,
        deps,
        opts,
        phase: this,
      });
  }

  createUseSync() {
    return (
      callback: UseSyncArgs["callback"],
      deps: UseSyncArgs["deps"],
      opts?: UseSyncArgs["opts"],
    ) =>
      useSync({
        callback,
        deps,
        opts,
        phase: this,
      });
  }
}
