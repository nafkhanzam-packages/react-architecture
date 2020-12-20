export const dummyAsync = <T>(value: T, timeout?: number) => async (
  ..._args: unknown[]
): Promise<T> => new Promise((resolve) => setTimeout(() => resolve(value), timeout ?? 1000));
