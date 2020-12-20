import {DependencyList, useCallback} from "react";

type MaybePromise<T> = Promise<T> | T;
type FetchCallbackReturn = MaybePromise<boolean | void>;

export const useHandleCallback = <T extends unknown[]>(
  setLoading: ((loading: boolean) => void) | null,
  callback: (...args: T) => FetchCallbackReturn,
  onError: (err: unknown) => void,
  params: T,
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
  }, [setLoading, callback, onError, params]);

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
    [setLoading, onError, ...deps], // eslint-disable-line react-hooks/exhaustive-deps
  );
