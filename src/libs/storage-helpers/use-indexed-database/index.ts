import { debug } from "@/helpers/debug-helpers";
import type {
  CoreOutput,
  UseIndexedDatabaseInputs,
  OpenDatabaseProperties,
  OpenDatabaseReturns,
  TransactionMode,
  CreateRowProperties,
  CreateRowReturns,
  RetrieveRowProperties,
  RetrieveRowReturns,
  UpdateRowProperties,
  UpdateRowReturns,
  DeleteRowProperties,
  DeleteRowReturns,
  ClearObjectStoreByNameProps,
  CreateObjectStoreProps,
  DeleteObjectStoreByNameProps,
} from "@/libs/storage-helpers/use-indexed-database/types";

export const useIndexedDatabase = ({
  databaseName,
  databaseVersion = 1,
  onSuccessCallback,
  onErrorCallback,
  onBlockedCallback,
  onUpgradeneededCallback,
}: UseIndexedDatabaseInputs) => {
  // Declared variables.
  const REQUEST_DOES_NOT_READY = "IndexedDB request does not ready.";
  let __request__: IDBOpenDBRequest | undefined = undefined;
  let __databaseVersion__ = databaseVersion
    ? Math.round(databaseVersion)
    : databaseVersion;
  let __database__: IDBDatabase | undefined = undefined;

  const onBlocked = (event: Event) => {
    try {
      const { readyState } = event.target as IDBOpenDBRequest;
      if (readyState !== "done") {
        debug({
          title: "onBlocked",
          description: REQUEST_DOES_NOT_READY,
          debugLevel: "warning",
          parameters: { readyState },
        });
        return;
      }

      debug({
        title: "onBlocked",
        debugLevel: "error",
        description: "Please close all other tabs with this site open!",
      });

      // Execute callback.
      onBlockedCallback && onBlockedCallback();
    } catch (error) {
      debug({
        title: "onBlocked",
        flag: "catch",
        debugLevel: "error",
        description: (error as any).message,
        parameters: { event },
      });
    }
  };

  const onError = (event: Event) => {
    try {
      const { readyState, error } = event.target as IDBOpenDBRequest;

      debug({
        title: "onError",
        debugLevel: "warning",
        flag: error?.name,
        description: error?.message,
        parameters: { readyState },
      });

      // Execute callback.
      onErrorCallback && onErrorCallback(event);
    } catch (error) {
      debug({
        title: "onError",
        flag: "catch",
        debugLevel: "error",
        description: (error as any).message,
      });
    }
  };

  const onSuccess = (event: Event) => {
    try {
      const { readyState, result } = event.target as IDBOpenDBRequest;
      setDatabase(result);

      // Declared parameters for log.
      const parameters = {
        name: result.name,
        version: result.version,
        objectStoreNames: result.objectStoreNames,
      };

      if (readyState !== "done") {
        return debug({
          title: "onSuccess",
          description: REQUEST_DOES_NOT_READY,
          debugLevel: "warning",
          parameters,
        });
      }

      debug({ title: "onSuccess", parameters });

      // Execute callback.
      onSuccessCallback && onSuccessCallback(result);
    } catch (error) {
      debug({
        title: "onSuccess",
        flag: "catch",
        debugLevel: "error",
        description: (error as any).message,
      });
    }
  };

  const onUpgradeNeeded = (event: IDBVersionChangeEvent) => {
    try {
      const target = event.target as IDBOpenDBRequest;
      const database = target.result as IDBDatabase;
      setDatabase(database);

      debug({
        title: "onUpgradeNeeded",
        parameters: { result: target.result, database },
      });

      // Execute callback.
      onUpgradeneededCallback && onUpgradeneededCallback(database);
    } catch (error) {
      debug({
        title: "onUpgradeNeeded",
        flag: "catch",
        debugLevel: "error",
        description: (error as any).message,
      });
    }
  };

  /**
   * Create database object store.
   * Call this method in onUpgradeneededCallback.
   */
  const createObjectStore = <T>({
    storeName,
    options,
    indexOptions,
  }: CreateObjectStoreProps<T>) => {
    try {
      const database = getDatabase();
      if (!database) throw new Error("Database does not found.");

      const createdObjectStore = database.createObjectStore(
        storeName,
        options as IDBObjectStoreParameters
      );
      const createdIndexList: IDBIndex[] = [];

      // Has object store indexOptions.
      if (indexOptions && Array.isArray(indexOptions) && indexOptions.length) {
        indexOptions.forEach(({ name, keyPath, options }) => {
          const createdIndex = createdObjectStore.createIndex(
            name as string,
            keyPath as string | Iterable<string>,
            options
          );
          createdIndexList.push(createdIndex);
        });
      }

      return {
        objectStore: createdObjectStore,
        indexList: createdIndexList,
      };
    } catch (error) {
      debug({
        title: "createObjectStore",
        debugLevel: "error",
        flag: "catch",
        description: (error as any).message,
      });
    }
  };

  /**
   * Retrieve database object store.
   */
  const retrieveObjectStore = (
    storeName: string,
    mode: TransactionMode = "readonly"
  ) => getTransaction(storeName, mode)?.objectStore(storeName);

  /**
   * Getting transaction of object store.
   */
  const getTransaction = (
    storeName: string,
    mode: TransactionMode = "readonly"
  ) => {
    const database = getDatabase();
    return database ? database.transaction(storeName, mode) : null;
  };

  /**
   * Clear database store by store name.
   */
  const clearObjectStoreByName = ({
    storeName,
    onSuccessCallback,
    onErrorCallback,
  }: ClearObjectStoreByNameProps) => {
    const store = retrieveObjectStore(storeName, "readwrite");
    if (!store) return;

    const request = store.clear();

    request.addEventListener(
      "success",
      (event: Event) => {
        debug({
          title: "clearObjectStoreByName",
          flag: "success",
          parameters: { event },
        });

        onSuccessCallback && onSuccessCallback(event);
      },
      false
    );

    request.addEventListener(
      "error",
      (event: Event) => {
        debug({
          title: "clearObjectStoreByName",
          flag: "error",
          debugLevel: "warning",
          parameters: { event },
        });

        onErrorCallback && onErrorCallback(event);
      },
      false
    );
  };

  /**
   * Delete object store by store name.
   * Call this method in onUpgradeneededCallback.
   */
  const deleteObjectStoreByName = ({
    storeName,
    onSuccessCallback,
    onFailureCallback,
  }: DeleteObjectStoreByNameProps) => {
    try {
      const database = getDatabase();
      database?.deleteObjectStore(storeName);

      // Execute callback.
      onSuccessCallback && onSuccessCallback();
    } catch (error) {
      onFailureCallback && onFailureCallback();
    }
  };

  /**
   * Create data row into object store.
   */
  const createRow = async <T>({
    storeName,
    data,
    onSuccessCallback,
    onErrorCallback,
  }: CreateRowProperties<T>): Promise<CreateRowReturns> => {
    try {
      const objectStore = retrieveObjectStore(storeName, "readwrite");
      if (!objectStore)
        throw new Error(`Does not found ${storeName} object store.`);

      const promise = new Promise<CreateRowReturns>((resolve, reject) => {
        const request = objectStore.add(data);

        request.addEventListener(
          "success",
          (event: Event) => {
            try {
              const { result } = event.target as IDBOpenDBRequest;
              debug({
                title: "createRow",
                flag: "success",
                parameters: { result },
              });

              onSuccessCallback && onSuccessCallback(result);

              resolve({ ok: true, data: result });
            } catch (error) {
              debug({
                title: "createRow",
                flag: "success:catch",
                description: (error as any).message,
              });

              reject({ ok: false, error: (error as any).message });
            }
          },
          false
        );

        request.addEventListener(
          "error",
          (event: Event) => {
            debug({
              title: "createRow",
              flag: "error",
              debugLevel: "warning",
              parameters: { event },
            });

            onErrorCallback && onErrorCallback(event);

            reject({ ok: false, error: "Failed add into object store." });
          },
          false
        );
      });

      return promise
        .then((result) => result)
        .catch((error: CoreOutput) => error);
    } catch (error) {
      debug({
        title: "createRow",
        flag: "catch",
        debugLevel: "error",
        description: `${(error as any).message}`,
      });

      return {
        ok: false,
        error: (error as any).message,
      };
    }
  };

  /**
   * Retrieve row data of object store.
   */
  const retrieveRow = async <T>({
    storeName,
    id,
    mode,
    onSuccessCallback,
    onErrorCallback,
  }: RetrieveRowProperties): Promise<RetrieveRowReturns<T>> => {
    try {
      const objectStore = retrieveObjectStore(storeName, mode);
      if (!objectStore)
        throw new Error(`Does not found ${storeName} object store.`);

      const promise = new Promise<RetrieveRowReturns<T>>((resolve, reject) => {
        const request = id ? objectStore.get(id) : objectStore.getAll();

        request.addEventListener(
          "success",
          (event: Event) => {
            try {
              const { result } = event.target as IDBOpenDBRequest;
              debug({
                title: "retrieveRow",
                flag: "success",
                parameters: { result },
              });

              // Execute callback.
              onSuccessCallback && onSuccessCallback(result);

              resolve({
                ok: true,
                data: result as T,
              });
            } catch (error) {
              debug({
                title: "retrieveRow",
                flag: "success:catch",
                debugLevel: "warning",
                description: (error as any).message,
                parameters: { event },
              });

              reject({
                ok: false,
                error: (error as any).message,
                data: event,
              });
            }
          },
          false
        );

        request.addEventListener(
          "error",
          (event: Event) => {
            debug({
              title: "retrieveRow",
              flag: "error",
              debugLevel: "warning",
              parameters: { event },
            });

            // Execute callback.
            onErrorCallback && onErrorCallback(event);

            reject({
              ok: false,
              error: "Failed retrieve row.",
              data: event,
            });
          },
          false
        );
      });

      return promise
        .then((result) => result)
        .catch((error: CoreOutput) => error);
    } catch (error) {
      debug({
        title: "retrieveRow",
        flag: "catch",
        debugLevel: "error",
        description: (error as any).message,
      });

      return {
        ok: false,
        error: (error as any).message,
      };
    }
  };

  /**
   * Update row data of object store.
   */
  const updateRowById = async <T>({
    storeName,
    id,
    data,
    onSuccessCallback,
    onErrorCallback,
  }: UpdateRowProperties<T>): Promise<UpdateRowReturns> => {
    try {
      const objectStore = retrieveObjectStore(storeName, "readwrite");
      if (!objectStore)
        throw new Error(`Does not found ${storeName} object store`);

      const promise = new Promise<UpdateRowReturns>((resolve, reject) => {
        const getRequest = objectStore.get(id);

        getRequest.addEventListener(
          "success",
          (_: Event) => {
            // Put data.
            const updateRequest = objectStore.put(data);

            updateRequest.addEventListener("success", (event: Event) => {
              const { result } = event.target as IDBOpenDBRequest;
              debug({
                title: "updateRowById",
                flag: "success",
                parameters: { result },
              });

              onSuccessCallback?.(result);

              resolve({ ok: true, data: result });
            });

            updateRequest.addEventListener("error", (event: Event) => {
              debug({
                title: "updateRowById",
                flag: "error",
                debugLevel: "warning",
                parameters: { event },
              });

              onErrorCallback?.(event);

              reject({
                ok: false,
                error: "Failed update row by id.",
              });
            });
          },
          false
        );

        getRequest.addEventListener(
          "error",
          (event: Event) => {
            debug({
              title: "updateRowById",
              flag: "retrieve",
              debugLevel: "warning",
              parameters: { event },
            });

            onErrorCallback?.(event);

            reject({
              ok: false,
              error: "Failed retrieve row by id.",
              data: event,
            });
          },
          false
        );
      });

      return promise
        .then<UpdateRowReturns>((result) => result)
        .catch((error: CoreOutput) => error);
    } catch (error) {
      debug({
        title: "updateRowById",
        flag: "catch",
        debugLevel: "error",
        description: (error as any).message,
      });

      return {
        ok: false,
        error: (error as any).message,
      };
    }
  };

  /**
   * Remove row data of object store.
   */
  const deleteRowById = async ({
    storeName,
    id,
    onSuccessCallback,
    onErrorCallback,
  }: DeleteRowProperties): Promise<DeleteRowReturns> => {
    try {
      const objectStore = retrieveObjectStore(storeName, "readwrite");
      if (!objectStore)
        throw new Error(`Does not found ${storeName} object store.`);

      const promise = new Promise<DeleteRowReturns>((resolve, reject) => {
        const request = objectStore.delete(id);

        request.addEventListener(
          "success",
          (event: Event) => {
            try {
              const { result } = event.target as IDBOpenDBRequest;
              debug({
                title: "deleteRow",
                flag: "success",
                parameters: { result },
              });

              // Execute callback.
              onSuccessCallback && onSuccessCallback(result);

              resolve({
                ok: true,
                data: result,
              });
            } catch (error) {
              debug({
                title: "deleteRow",
                flag: "success:catch",
                description: (error as any).message,
              });

              reject({
                ok: false,
                error: (error as any).message,
              });
            }
          },
          false
        );

        request.addEventListener(
          "error",
          (event: Event) => {
            debug({
              title: "deleteRow",
              flag: "error",
              debugLevel: "warning",
              parameters: { event },
            });

            // Execute callback.
            onErrorCallback && onErrorCallback(event);

            reject({
              ok: false,
              error: "Failed delete row.",
              data: event,
            });
          },
          false
        );
      });

      return promise
        .then((result) => result)
        .catch((error: CoreOutput) => error);
    } catch (error) {
      debug({
        title: "deleteRowById",
        flag: "catch",
        debugLevel: "error",
        description: (error as any).message,
      });

      return {
        ok: false,
        error: (error as any).message,
      };
    }
  };

  /**
   * Getting IndexedDB request instance.
   */
  const getRequest = () => __request__;

  /**
   * Setting IndexedDB request instance.
   */
  const setRequest = (request: IDBOpenDBRequest) => (__request__ = request);

  /**
   * Getting database list.
   */
  const getDatabases = async () => window.indexedDB.databases() || [];

  /**
   * Getting IndexedDB database instance.
   */
  const getDatabase = () => __database__;

  /**
   * Setting IndexedDB database instance.
   */
  const setDatabase = (database: IDBDatabase) => (__database__ = database);

  /**
   * Close IndexedDB database instance.
   */
  const closeDatabase = () => getDatabase()?.close();

  /**
   * Open IndexedDB database.
   */
  const openDatabase = ({
    name,
    version,
    onOpenDatabase,
  }: OpenDatabaseProperties): OpenDatabaseReturns => {
    // This browser is not supported?
    if (!window.indexedDB) {
      debug({
        title: "openDatabase",
        debugLevel: "warning",
        description: `Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.`,
        parameters: { name, version },
      });
      return {
        ok: false,
        error: `Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.`,
      };
    }

    // Already opened database?
    closeDatabase();

    // Has database version?
    const request = version
      ? window.indexedDB.open(name, version)
      : window.indexedDB.open(name);
    // Set database open request.
    setRequest(request);

    // Set event listeners.
    request.addEventListener("blocked", onBlocked, false);
    request.addEventListener("error", onError, false);
    request.addEventListener("success", onSuccess, false);
    request.addEventListener("upgradeneeded", onUpgradeNeeded, false);

    onOpenDatabase && onOpenDatabase();

    return {
      ok: true,
      data: request,
    };
  };

  /**
   * Getting database version.
   * @returns {number} Database version.
   */
  const getDatabaseVersion = () => __databaseVersion__;

  /**
   * Initialize indexedDB.
   */
  const initialize = () => {
    const { ok, data, error } = openDatabase({
      name: databaseName,
      version: databaseVersion,
    });

    // Has problem?
    if (!ok) {
      return debug({
        title: "initialize",
        debugLevel: "warning",
        flag: "ok",
        description: error,
        parameters: { name: databaseName, version: databaseVersion },
      });
    }

    debug({
      title: "initialize",
      debugLevel: "info",
      flag: "success",
      description: "Database initialize success.",
      parameters: { data },
    });
  };

  initialize();

  return {
    getRequest,
    setRequest,
    getDatabases,
    getDatabase,
    setDatabase,
    openDatabase,
    closeDatabase,
    createObjectStore,
    retrieveObjectStore,
    clearObjectStoreByName,
    deleteObjectStoreByName,
    createRow,
    retrieveRow,
    updateRowById,
    deleteRowById,
    getTransaction,
    getDatabaseVersion,
  };
};
