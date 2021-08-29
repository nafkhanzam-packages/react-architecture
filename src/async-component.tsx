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

export type PromiseAsyncComponentProps<T> = Omit<Props<T>, "data"> & {
  data: PAD<T>;
};

export const PromiseAsyncComponent = <T,>(props: PromiseAsyncComponentProps<T>) => {
  let initialData: AsyncData<T> = {status: "loading"};
  if (!isPromise(props.data)) {
    if (typeof props.data === "object" && "status" in props.data) {
      initialData = props.data;
    } else {
      initialData = {status: "success", data: props.data};
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
