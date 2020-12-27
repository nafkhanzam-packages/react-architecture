import {DependencyList, useCallback} from "react";

type MaybePromise<T> = Promise<T> | T;
type FetchCallbackReturn = MaybePromise<boolean | void>;

export const useHandleCallback = <T extends unknown[]>(
  setLoading: ((loading: boolean) => void) | null,
  callback: (...args: T) => FetchCallbackReturn,
  onError: (err: unknown) => void,
  params: T,
  deps: DependencyList = [],
) =>
  useCallback(async () => {
    setLoading?.(true);
    try {
      const res = await callback(...params);
      if (res) {
        return;
      }
    } catch (error) {
      onError(error);
    }
    setLoading?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

export const useHandleCallbackWithArgs = <T extends unknown[]>(
  setLoading: ((loading: boolean) => void) | null,
  callback: (...args: T) => FetchCallbackReturn,
  onError: (err: unknown) => void,
  deps: DependencyList = [],
) =>
  useCallback(
    async (...args: T) => {
      setLoading?.(true);
      try {
        const res = await callback(...args);
        if (res) {
          return;
        }
      } catch (error) {
        onError(error);
      }
      setLoading?.(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );
