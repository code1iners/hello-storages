export interface IndexedDbCommonCallbacks {
  onSuccessCallback?: (database: IDBDatabase) => void;
  onErrorCallback?: (event: Event) => void;
}

export interface IndexedSpecialCallbacks extends IndexedDbCommonCallbacks {
  onBlockedCallback?: () => void;
  onUpgradeneededCallback?: (database: IDBDatabase) => void;
}

export interface UseIndexedDatabaseInputs extends IndexedSpecialCallbacks {
  databaseName: string;
  databaseVersion?: number;
}

export interface AddRowProperties<T> extends IndexedDbCommonCallbacks {
  storeName: string;
  data: T;
}

export interface RemoveRowProperties extends IndexedDbCommonCallbacks {
  storeName: string;
  id: number;
}

export interface ClearObjectStoreByNameProps {
  storeName: string;
  onSuccessCallback?: (event: Event) => void;
  onErrorCallback?: (event: Event) => void;
}

export interface CreateObjectStoreOption<T> {
  keyPath?: keyof T;
  autoIncrement?: boolean;
}

export interface CreateObjectStoreProps<T> {
  storeName: string;
  options?: CreateObjectStoreOption<T>;
  indexOptions?: ObjectStoreIndexOption<T>[];
}

export interface DeleteObjectStoreByNameProps {
  storeName: string;
  onSuccessCallback?: () => void;
  onFailureCallback?: () => void;
}

export interface ObjectStoreIndexOption<T> {
  name: keyof T;
  keyPath: keyof T;
  options?: IDBIndexParameters | undefined;
}

export type TransactionMode = "readonly" | "readwrite" | "versionchange";

export interface OpenDatabaseProperties {
  name: string;
  version: number;
  onOpenDatabase?: () => void;
}

export interface OpenDatabaseReturns {
  ok: boolean;
  data?: IDBOpenDBRequest;
  error?: string;
}