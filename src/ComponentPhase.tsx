import {ReactNode, useCallback, useEffect, useState} from "react";

enum Status {
  LOADING,
  ERROR,
  DONE,
}

type Options = {
  loadingComponent?: ComponentType;
  errorComponent?: ComponentType;
};

type ComponentType = ReactNode;

export class ComponentPhase {
  constructor(
    private defaults: {
      loadingComponent: ComponentType;
      errorComponent: ComponentType;
      onError?: (err: unknown) => void;
    },
  ) {}

  getComponent(status: Status, doneComponent: ComponentType, opts?: Options): ComponentType {
    if (status === Status.LOADING) {
      return opts?.loadingComponent ?? this.defaults.loadingComponent;
    } else if (status === Status.ERROR) {
      return opts?.errorComponent ?? this.defaults.errorComponent;
    } else {
      return doneComponent;
    }
  }

  onError(err: unknown) {
    if (this.defaults.onError) {
      this.defaults.onError(err);
    } else {
      console.error(err);
    }
  }

  withAsync(callback: () => Promise<ComponentType>, opts?: Options) {
    const [component, setComponent] = useState<ComponentType>(null);
    const [status, setStatus] = useState<Status>(Status.LOADING);

    const refresh = useCallback(async () => {
      setStatus(Status.LOADING);
      try {
        const comp = await callback();
        setStatus(Status.DONE);
        setComponent(comp);
      } catch (err) {
        this.onError(err);
        setStatus(Status.ERROR);
      }
    }, []);

    useEffect(() => {
      refresh();
    }, []);

    return [this.getComponent(status, component, opts), refresh];
  }

  withSync(callback: () => ComponentType, opts?: Options) {
    const load = useCallback(() => {
      try {
        const comp = callback();
        return this.getComponent(Status.DONE, comp, opts);
      } catch (err) {
        this.onError(err);
        return this.getComponent(Status.ERROR, null, opts);
      }
    }, []);

    const [comp, setComp] = useState(load());

    return [comp, () => setComp(load())];
  }
}
