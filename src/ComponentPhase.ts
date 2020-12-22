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

type ComponentType = ReactElement | null;
type GetComponentType = (
  status: Status,
  doneComponent: ComponentType | null,
  opts?: Options,
) => ComponentType;

type AsyncReturnType = [ComponentType, () => Promise<void>];
type SyncReturnType = [ComponentType, () => void];

type UseAsyncArgs = Omit<AsyncProps, "phase">;
type UseSyncArgs = Omit<SyncProps, "phase">;

type AsyncProps = {
  phase: ComponentPhase;
  getComponent: () => Promise<ComponentType | null>;
  deps: DependencyList;
  opts?: Options;
};

export const useAsync = (props: AsyncProps): AsyncReturnType => {
  const [comp, setComp] = useState<ComponentType>(
    props.phase.getComponent(Status.LOADING, null, props.opts),
  );
  const refreshingRef = useRef(false);
  // const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) {
      return;
    }
    try {
      setComp(props.phase.getComponent(Status.LOADING, null, props.opts));
      refreshingRef.current = true;
      const component = await props.getComponent();
      setComp(props.phase.getComponent(Status.DONE, component, props.opts));
    } catch (err) {
      props.phase.onError(err);
      setComp(props.phase.getComponent(Status.ERROR, null, props.opts));
    } finally {
      refreshingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, props.deps);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return [comp, refresh];
};

type SyncProps = {
  phase: ComponentPhase;
  getComponent: () => ComponentType | null;
  deps: DependencyList;
  opts?: Options;
};

export const useSync = (props: SyncProps): SyncReturnType => {
  const load = useCallback(() => {
    try {
      const component = props.getComponent();
      return props.phase.getComponent(Status.DONE, component, props.opts);
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
    (this.onError ?? console.error)(err);
  }

  useAsync(
    getData: UseAsyncArgs["getComponent"],
    deps: UseAsyncArgs["deps"],
    opts?: UseAsyncArgs["opts"],
  ) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useAsync({
      getComponent: getData,
      deps,
      opts,
      phase: this,
    });
  }

  useSync(
    getData: UseSyncArgs["getComponent"],
    deps: UseSyncArgs["deps"],
    opts?: UseSyncArgs["opts"],
  ) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSync({
      getComponent: getData,
      deps,
      opts,
      phase: this,
    });
  }
}
