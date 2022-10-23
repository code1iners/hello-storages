import { useIndexedDatabase } from "@/libs/storage-helpers/use-indexed-database";

interface Member {
  memberId?: number;
  name: string;
  age: number;
}

export default function IndexedDb() {
  const DATABASE_VERSION = 2;
  const { addRow, removeRowById, createObjectStore } = useIndexedDatabase({
    databaseName: "custom-database",
    databaseVersion: DATABASE_VERSION,
    onUpgradeneededCallback: (database) => {
      switch (database.version) {
        case 1:
          createObjectStore<Member>({
            storeName: `test-store-${database.version}`,
            options: { autoIncrement: true, keyPath: "memberId" },
            indexOptions: [
              {
                keyPath: "memberId",
                name: "memberId",
                options: { unique: true },
              },
            ],
          });

          break;

        case 2:
          createObjectStore<Member>({
            storeName: `test-store-${database.version}`,
            options: { autoIncrement: true, keyPath: "memberId" },
            indexOptions: [
              {
                keyPath: "memberId",
                name: "memberId",
                options: { unique: true },
              },
              {
                keyPath: "name",
                name: "name",
              },
              {
                keyPath: "age",
                name: "age",
              },
            ],
          });

          break;
      }
    },
    onSuccessCallback: () => {
      // addRow<Member>({
      //   storeName: `test-store-${DATABASE_VERSION}`,
      //   data: {
      //     age: 50000,
      //     name: "asdf",
      //   },
      // });
      // removeRowById({ storeName: "test-store-2", id: 3 });
    },
  });

  return <div>Indexed DB</div>;
}
