/* eslint-disable react-hooks/rules-of-hooks */
import {DependencyList, ReactElement, useCallback, useEffect, useMemo, useState} from "react";

enum Status {
  LOADING,
  ERROR,
  DONE,
}

type ComponentType = ReactElement | null;
type ErrorComponentType = (err: unknown) => ComponentType;

type Options = {
  loadingComponent?: ComponentType;
  errorComponent?: ErrorComponentType;
};

export class ComponentPhase {
  constructor(
    public defaults: {
      loadingComponent: ComponentType;
      errorComponent: ErrorComponentType;
      onError?: (err: unknown) => void;
    },
  ) {}

  getComponent(status: Status, doneComponent: ComponentType | null, opts?: Options, err?: unknown) {
    if (status === Status.LOADING || (status === Status.DONE && doneComponent === null)) {
      return opts?.loadingComponent ?? this.defaults.loadingComponent;
    } else if (status === Status.ERROR || doneComponent === null) {
      return opts?.errorComponent?.(err) ?? this.defaults.errorComponent(err);
    } else {
      return doneComponent;
    }
  }

  onError(err: unknown) {
    (this.defaults.onError ?? console.error)(err);
  }

  useAsync(
    getComponent: () => Promise<ComponentType | null>,
    deps: DependencyList,
    opts?: Options,
  ): [ComponentType, () => Promise<void>] {
    const [comp, setComp] = useState<ComponentType>(this.getComponent(Status.LOADING, null, opts));
    // const mountedRef = useRef(true);

    const refresh = useCallback(async () => {
      try {
        setComp(this.getComponent(Status.LOADING, null, opts));
        const component = await getComponent();
        setComp(this.getComponent(Status.DONE, component, opts));
      } catch (err) {
        this.onError(err);
        setComp(this.getComponent(Status.ERROR, null, opts, err));
      }
    }, [getComponent, opts]);

    useEffect(() => {
      refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return [comp, refresh];
  }

  useSync(
    getComponent: () => ComponentType | null,
    deps: DependencyList,
    opts?: Options,
  ): [ComponentType, () => void] {
    const [refresh, setRefresh] = useState(false);

    const loadComponent = useCallback(() => {
      try {
        const component = getComponent();
        return this.getComponent(Status.DONE, component, opts);
      } catch (err) {
        this.onError(err);
        return this.getComponent(Status.ERROR, null, opts);
      }
    }, [getComponent, opts]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const comp = useMemo(() => loadComponent(), [...deps, refresh]);

    return [comp, () => setRefresh(!refresh)];
  }
}
