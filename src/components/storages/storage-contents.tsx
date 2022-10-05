import { useRecoilValue } from "recoil";
import { currentStorageTypeAtom } from "@/atoms";
import { StorageType } from "@/constants/storage.constants";
import IndexedDb from "@/components/storages/indexed-db";
import LocalStorage from "@/components/storages/local-storage";
import SessionStorage from "@/components/storages/session-storage";

export default function StorageContents() {
  const currentStorageType = useRecoilValue(currentStorageTypeAtom);

  return (
    <div>
      {(() => {
        switch (currentStorageType) {
          case StorageType.IndexedDB:
            return <IndexedDb />;

          case StorageType.LocalStorage:
            return <LocalStorage />;

          case StorageType.SessionStorage:
            return <SessionStorage />;
        }
      })()}
    </div>
  );
}
