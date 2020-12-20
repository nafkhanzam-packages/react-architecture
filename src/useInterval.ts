import {DependencyList, useCallback, useEffect} from "react";

export function useInterval(callback: () => void, deps: DependencyList, delay: number) {
  const savedCallback = useCallback(callback, [callback, ...deps]);

  useEffect(() => {
    if (delay > 0) {
      const id = setInterval(savedCallback, delay);
      return () => clearInterval(id);
    }
  }, [savedCallback, delay]);
}
