export const dummyAsync = <T extends any>(value: T, timeout?: number) => async (
  ..._args: any
): Promise<T> => new Promise((resolve) => setTimeout(() => resolve(value), timeout ?? 1000));
