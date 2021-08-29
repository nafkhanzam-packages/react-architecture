import React, {ReactElement, useEffect, useState} from "react";
import {isPromise} from "@nafkhanzam/common-utils";
import {AsyncData, PAD, SyncPromise} from "./types";

type ReturnNode = ReactElement<any, any> | null;

/**
 * This function allow you to modify a JS Promise by adding some status properties.
 * Based on: http://stackoverflow.com/questions/21485545/is-there-a-way-to-tell-if-an-es6-promise-is-fulfilled-rejected-resolved
 * But modified according to the specs of promises : https://promisesaplus.com/
 */
function createSyncPromise<T>(promise: Promise<T>): SyncPromise<T> {
  // Set initial state
  let value: T | null = null;

  // Observe the promise, saving the fulfillment in a closure scope.
  const result: any = promise.then(
    function (v) {
      value = v;
      return v;
    },
    function (e) {
      throw e;
    },
  );
  result.getValue = function () {
    return value;
  };
  return result;
}

const getAsyncData = async <T,>(
  callback: () => Promise<T>,
  opts?: {
    onError?: (err: unknown) => void;
    onRefresh?: (err: unknown) => void;
  },
): Promise<AsyncData<T>> => {
  const onError = opts?.onError ?? console.error;

  try {
    const data = await callback();
    return {
      status: "success",
      data,
    };
  } catch (error) {
    onError(error);
    return {
      status: "error",
      error,
      onRefresh: opts?.onRefresh,
    };
  }
};

export const asyncdatautils = {
  createSyncPromise,
  getAsyncData,
};

type Props<T> = {
  data: AsyncData<T>;
  loadingComponent: ReturnNode;
  errorComponent?: (state: AsyncData<T>) => ReturnNode;
  children?: (data: T) => ReturnNode;
};

export const AsyncComponent = <T,>(props: Props<T>): ReturnNode => {
  switch (props.data.status) {
    case "loading":
      return props.loadingComponent;
    case "error":
      return props.errorComponent?.(props.data) ?? props.loadingComponent;
    case "success":
      return props.children ? props.children(props.data.data) : <></>;
  }
};

type PADType<T> =
  | {
      type: "promise";
      value: Promise<AsyncData<T>>;
    }
  | {
      type: "resolved";
      value: AsyncData<T>;
    }
  | {
      type: "value";
      value: T;
    };

export const getPADType = <T,>(v: PAD<T>): PADType<T> => {
  if (isPromise(v)) {
    return {
      type: "promise",
      value: v,
    };
  } else {
    if (typeof v === "object" && "status" in v) {
      return {
        type: "resolved",
        value: v,
      };
    } else {
      return {
        type: "value",
        value: v,
      };
    }
  }
};

export type PromiseAsyncComponentProps<T> = Omit<Props<T>, "data"> & {
  data: PAD<T>;
};

export const PromiseAsyncComponent = <T,>(props: PromiseAsyncComponentProps<T>) => {
  let initialData: AsyncData<T> = {status: "loading"};
  const padt = getPADType(props.data);
  switch (padt.type) {
    case "resolved": {
      initialData = padt.value;
      break;
    }
    case "value": {
      initialData = {
        status: "success",
        data: padt.value,
      };
      break;
    }
  }
  const [data, setData] = useState<AsyncData<T>>(initialData);

  useEffect(() => {
    const propsData = props.data;
    if (isPromise(propsData)) {
      (async () => {
        setData(await propsData);
      })();
    }
  }, [props.data]);

  return <AsyncComponent {...props} data={data} />;
};

export const padm = <T, R>(pad: PAD<T>, mapFn: (t: T) => R): PAD<R> => {
  const padt = getPADType(pad);
  switch (padt.type) {
    case "promise": {
      return new Promise<AsyncData<R>>(async (resolve) => {
        const value = await padt.value;
        resolve(padm<T, R>(value, mapFn) as AsyncData<R>);
      });
    }
    case "resolved": {
      switch (padt.value.status) {
        case "success": {
          return {
            status: "success",
            data: mapFn(padt.value.data),
          };
        }
        case "loading":
        case "error": {
          return padt.value;
        }
      }
    }
    case "value": {
      return {
        status: "success",
        data: mapFn(padt.value),
      };
    }
  }
};
