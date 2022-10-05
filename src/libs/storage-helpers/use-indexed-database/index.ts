import { debug } from "@/helpers/debug-helpers";

interface UseIndexedDatabaseInput {
  databaseName: string;
  databaseVersion?: number;
  isLogVisible?: boolean;
}

export const useIndexedDatabase = ({
  databaseName,
  databaseVersion,
  isLogVisible = false,
}: UseIndexedDatabaseInput) => {
  // Declared variables.
  const REQUEST_DOES_NOT_READY = "IndexedDB request does not ready.";
  let __request__: IDBOpenDBRequest | undefined = undefined;
  let __databaseVersion__ = databaseVersion
    ? Math.round(databaseVersion)
    : databaseVersion;

  const onBlocked = (event: Event) => {
    try {
      const { readyState, result } = event.target as IDBOpenDBRequest;
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
        parameters: { result },
      });
    } catch (error) {
      console.error("[onBlocked:error]", error);
    }
  };

  const onError = (event: Event) => {
    try {
      const { readyState, result, error } = event.target as IDBOpenDBRequest;
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
        parameters: { message: error?.message, name: error?.name },
      });
    } catch (error) {
      console.error("[onError:error]", error);
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

      debug({
        title: "onBlocked",
        parameters,
      });
    } catch (error) {
      console.error("[onSuccess:error]", error);
    }
  };

  const onUpgradeNeeded = (event: IDBVersionChangeEvent) => {
    debug({
      title: "onUpgradeNeeded",
      description: REQUEST_DOES_NOT_READY,
      debugLevel: "warning",
      parameters: { event },
    });
  };

  /**
   * Getting IndexedDB request instance.
   */
  const getRequest = () => __request__;

  /**
   * Getting database list.
   */
  const getDatabases = async () => window.indexedDB.databases() || [];

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

  return { getRequest, getDatabases };
};
