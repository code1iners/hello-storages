import { atom } from "recoil";
import { StorageType } from "../constants/storage.constants";

export const currentStorageTypeAtom = atom({
  key: "currentStorageTypeStateKey",
  default: StorageType.IndexedDB,
});
