import { useSetRecoilState } from "recoil";
import { currentStorageTypeAtom } from "@/atoms";
import { StorageType } from "@/constants/storage.constants";

export default function StorageList() {
  const setCurrentStorageType = useSetRecoilState(currentStorageTypeAtom);

  const onStorageTypeClick = (storageType: StorageType) =>
    setCurrentStorageType(storageType);

  return (
    <ul className="flex justify-center items-center gap-5">
      <li>
        <button onClick={() => onStorageTypeClick(StorageType.IndexedDB)}>
          indexedDB
        </button>
      </li>
      <li>
        <button onClick={() => onStorageTypeClick(StorageType.LocalStorage)}>
          local storage
        </button>
      </li>
      <li>
        <button onClick={() => onStorageTypeClick(StorageType.SessionStorage)}>
          session storage
        </button>
      </li>
    </ul>
  );
}
