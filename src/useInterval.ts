import {DependencyList, useCallback, useEffect} from "react";

export function useInterval(callback: () => void, delay: number, deps: DependencyList) {
  const savedCallback = useCallback(callback, [callback, ...deps]);

  useEffect(() => {
    if (delay) {
      const id = setInterval(savedCallback, delay);
      return () => clearInterval(id);
    }
  }, [savedCallback, delay]);
}
