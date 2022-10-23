import { useIndexedDatabase } from "@/libs/storage-helpers/use-indexed-database";

interface Member {
  memberId?: number;
  name: string;
  age: number;
}

export default function IndexedDb() {
  const DATABASE_VERSION = 1;
  const { createRow, retrieveRow, deleteRowById, createObjectStore } =
    useIndexedDatabase({
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
      onSuccessCallback: async () => {
        const { ok, data, error } = await retrieveRow<Member>({
          storeName: "test-store-1",
        });
        if (!ok) return console.log(error);

        console.log(data);

        // createRow<Member>({
        //   storeName: `test-store-${DATABASE_VERSION}`,
        //   data: {
        //     age: 50000,
        //     name: "asdf",
        //   },
        // });
        // deleteRowById({ storeName: "test-store-2", id: 3 });
      },
    });

  return <div>Indexed DB</div>;
}
