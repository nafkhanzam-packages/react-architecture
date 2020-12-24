/* eslint-disable react-hooks/rules-of-hooks */
import {DependencyList, ReactElement, useCallback, useEffect, useRef, useState} from "react";

enum Status {
  LOADING,
  ERROR,
  DONE,
}

type ComponentType = ReactElement | null;

type Options = {
  loadingComponent?: ComponentType;
  errorComponent?: ComponentType;
};

export class ComponentPhase {
  constructor(
    private defaults: {
      loadingComponent: ComponentType;
      errorComponent: ComponentType;
      onError?: (err: unknown) => void;
    },
  ) {}

  getComponent(status: Status, doneComponent: ComponentType | null, opts?: Options) {
    if (status === Status.LOADING || (status === Status.DONE && doneComponent === null)) {
      return opts?.loadingComponent ?? this.defaults.loadingComponent;
    } else if (status === Status.ERROR || doneComponent === null) {
      return opts?.errorComponent ?? this.defaults.errorComponent;
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
    const refreshingRef = useRef(false);
    // const mountedRef = useRef(true);

    const refresh = useCallback(async () => {
      if (refreshingRef.current) {
        return;
      }
      try {
        refreshingRef.current = true;
        setComp(this.getComponent(Status.LOADING, null, opts));
        const component = await getComponent();
        setComp(this.getComponent(Status.DONE, component, opts));
      } catch (err) {
        this.onError(err);
        setComp(this.getComponent(Status.ERROR, null, opts));
      } finally {
        refreshingRef.current = false;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    useEffect(() => {
      refresh();
    }, [refresh]);

    return [comp, refresh];
  }

  useSync(getComponent: () => ComponentType | null, deps: DependencyList, opts?: Options) {
    const load = useCallback(() => {
      try {
        const component = getComponent();
        return this.getComponent(Status.DONE, component, opts);
      } catch (err) {
        this.onError(err);
        return this.getComponent(Status.ERROR, null, opts);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    const [comp, setComp] = useState(load());

    return [comp, () => setComp(load())];
  }
}
