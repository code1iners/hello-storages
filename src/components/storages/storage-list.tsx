import { useSetRecoilState } from "recoil";
import { currentStorageTypeAtom } from "@/atoms";
import { StorageType } from "@/constants/storage.constants";

export default function StorageList() {
  const setCurrentStorageType = useSetRecoilState(currentStorageTypeAtom);

  const onStorageTypeClick = (storageType: StorageType) =>
    setCurrentStorageType(storageType);

  return (
    <section className="storage-type-list__container">
      <ul>
        <li onClick={() => onStorageTypeClick(StorageType.IndexedDB)}>
          indexedDB
        </li>
        <li onClick={() => onStorageTypeClick(StorageType.LocalStorage)}>
          local storage
        </li>
        <li onClick={() => onStorageTypeClick(StorageType.SessionStorage)}>
          session storage
        </li>
      </ul>
    </section>
  );
}
