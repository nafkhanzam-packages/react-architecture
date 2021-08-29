export type AsyncData<T> =
  | {status: "success"; data: T}
  | {status: "error"; error: unknown; onRefresh?: (err: unknown) => void}
  | {status: "loading"};

export type SyncPromise<T> = Promise<T> & {getValue: () => T | null};

export type PAD<T> = Promise<AsyncData<T>> | AsyncData<T> | T;
