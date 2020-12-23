import AsyncStorage from "@react-native-async-storage/async-storage";

type Type = string | number | boolean | Type[] | {[key: string]: Type};

type NullableValue<T> = {
  [K in keyof T]: T[K] | null;
};

/**
 * A wrapper to the RNC `AsyncStorage`.
 */
export class Storage<StorageType extends {[key: string]: Type}> {
  /**
   * Save object in JSON string using the key.
   * @param key The key of the object
   * @param value The object stored
   */
  async set<K extends keyof StorageType>(key: K, value: StorageType[K]): Promise<void> {
    return await AsyncStorage.setItem(key.toString(), JSON.stringify(value));
  }

  /**
   * Get the object from the key.
   * @param key The key of the object
   */
  async get<K extends keyof StorageType>(key: K): Promise<StorageType[K] | null> {
    const value = await AsyncStorage.getItem(key.toString());
    return value ? (JSON.parse(value) as StorageType[K]) : null;
  }

  /**
   * Saves multiple JS object.
   * @param obj The JS object passed to be saved
   */
  async multiSet(obj: Partial<StorageType>): Promise<void> {
    return await AsyncStorage.multiSet(
      Object.entries(obj).map(([key, value]) => [key, JSON.stringify(value)]),
    );
  }

  /**
   * Gets multiple JS object.
   * @param keys The keys passed
   */
  async multiGet<K extends keyof StorageType>(
    keys: K[],
  ): Promise<NullableValue<Pick<StorageType, K>>> {
    const entries = await AsyncStorage.multiGet(keys.map((v) => v.toString()));

    //! Unsafe.
    const result = {} as NullableValue<Pick<StorageType, K>>;
    for (const [key, value] of entries) {
      const k = key as keyof Pick<StorageType, K>;
      result[k] = value === null ? null : JSON.parse(value);
    }

    return result;
  }

  /**
   * Detaches the object from the key.
   * @param key The key of the removed item
   */
  async remove(key: keyof StorageType): Promise<void> {
    return await AsyncStorage.removeItem(key.toString());
  }

  /**
   * Detaches multiple objects from given keys.
   * @param keys The keys of the removed items
   */
  async multiRemove(keys: (keyof StorageType)[]): Promise<void> {
    return await AsyncStorage.multiRemove(keys.map((v) => v.toString()));
  }

  /**
   * Clear all values
   */
  async clear() {
    await AsyncStorage.clear();
  }
}
