import { debug } from "@/helpers/debug-helpers";

interface UseIndexedDatabaseInput {
  databaseName: string;
  databaseVersion?: number;
}

interface TodoItem {
  task: string;
  done: boolean;
}

export const useIndexedDatabase = ({
  databaseName,
  databaseVersion,
}: UseIndexedDatabaseInput) => {
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
        });
        return;
      }

      debug({
        title: "onBlocked",
        debugLevel: "error",
        description: "Please close all other tabs with this site open!",
      });
    } catch (error) {
      debug({
        title: "onBlocked",
        flag: "catch",
        debugLevel: "error",
        description: (error as any).message,
      });
    }
  };

  const onError = (event: Event) => {
    try {
      const { readyState, error } = event.target as IDBOpenDBRequest;
      if (readyState !== "done") {
        debug({
          title: "onError",
          description: REQUEST_DOES_NOT_READY,
          debugLevel: "warning",
        });

        return;
      }

      debug({
        title: "onError",
        parameters: {
          message: error?.message,
          name: error?.name,
        },
      });
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
      // Declared parameters for log.
      const parameters = { name: result.name, version: result.version };
      if (readyState !== "done") {
        debug({
          title: "onSuccess",
          description: REQUEST_DOES_NOT_READY,
          debugLevel: "warning",
          parameters,
        });
        return;
      }

      __database__ = result;

      debug({
        title: "onSuccess",
        parameters,
      });
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
      const db = target.result as IDBDatabase;

      debug({
        title: "onUpgradeNeeded",
        flag: "start",
        parameters: { result: target.result, database: db },
      });

      switch (db.version) {
        case 1:
          const versionOneStore = db.createObjectStore("todos", {
            autoIncrement: true,
            keyPath: "todoId",
          });

          break;
        case 2:
          break;
        case 3:
          break;
      }
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
   * Getting database object store.
   */
  const getObjectStore = (
    storeName: string,
    mode: "readonly" | "readwrite"
  ) => {
    if (!__database__) return null;
    const transaction = __database__.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  };

  /**
   * Clear database stores.
   */
  const clearObjectStore = (storeName: string) => {
    const store = getObjectStore(storeName, "readwrite");
    if (!store) return;

    const request = store.clear();

    request.addEventListener(
      "success",
      (event: Event) => {
        debug({
          title: "clearObjectStore",
          flag: "success",
          parameters: { event },
        });
      },
      false
    );

    request.addEventListener(
      "error",
      (event: Event) => {
        debug({
          title: "clearObjectStore",
          flag: "error",
          debugLevel: "warning",
          parameters: { event },
        });
      },
      false
    );
  };

  /**
   * Add data into object store.
   */
  const addObjectStore = <T>(storeName: string, data: T[]) => {
    try {
      const store = getObjectStore(storeName, "readwrite");
      if (!store) throw new Error(`Does not found ${storeName} object store.`);

      const request = store.add(data);

      request.addEventListener(
        "success",
        (event: Event) => {
          try {
            const { result } = event.target as IDBOpenDBRequest;
            debug({
              title: "addObjectStore",
              flag: "success",
              parameters: { result },
            });
          } catch (error) {
            debug({
              title: "addObjectStore",
              flag: "success:catch",
              description: (error as any).message,
            });
          }
        },
        false
      );

      request.addEventListener(
        "error",
        (event: Event) => {
          debug({
            title: "addObjectStore",
            flag: "error",
            debugLevel: "error",
            parameters: { event },
          });
        },
        false
      );
    } catch (error) {
      debug({
        title: "addObjectStore",
        flag: "error:catch",
        debugLevel: "error",
        description: `${(error as any).message}`,
      });
    }
  };

  /**
   * Getting IndexedDB request instance.
   */
  const getRequest = () => __request__;

  /**
   * Getting database list.
   */
  const getDatabases = async () => window.indexedDB.databases() || [];

  /**
   * Getting IndexedDB database instance.
   */
  const getDatabase = () => __database__;

  // Initialize indexedDB.
  (() => {
    // This browser is supported?
    if (!window.indexedDB) {
      console.error(
        `Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.`
      );
      return;
    }

    // Has database version?
    __request__ = databaseVersion
      ? window.indexedDB.open(databaseName, __databaseVersion__)
      : window.indexedDB.open(databaseName);

    __request__.addEventListener("blocked", onBlocked, false);
    __request__.addEventListener("error", onError, false);
    __request__.addEventListener("success", onSuccess, false);
    __request__.addEventListener("upgradeneeded", onUpgradeNeeded, false);
  })();

  return {
    getRequest,
    getDatabases,
    getDatabase,
    getObjectStore,
    clearObjectStore,
    addObjectStore,
  };
};
