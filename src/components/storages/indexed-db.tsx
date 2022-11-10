import { useForm } from "react-hook-form";
import { useIndexedDatabase } from "@/libs/storage-helpers/use-indexed-database";
import { useEffect, useMemo, useState } from "react";

interface PasswordInformation {
  passwordId?: number;
  title: string;
  userId: string;
  password: string;
}

export default function IndexedDb() {
  const DATABASE_VERSION = 1;
  const [selectedPassword, setSelectedPassword] =
    useState<PasswordInformation>();
  const [passwords, setPasswords] = useState<PasswordInformation[]>([]);
  const { register, handleSubmit, reset, setValue } =
    useForm<PasswordInformation>();
  const {
    createRow,
    retrieveRow,
    updateRowById,
    deleteRowById,
    createObjectStore,
  } = useMemo(() => {
    return useIndexedDatabase({
      databaseName: "custom-database",
      databaseVersion: DATABASE_VERSION,
      onUpgradeneededCallback: (database) => {
        switch (database.version) {
          case 1:
            createObjectStore<PasswordInformation>({
              storeName: `test-store-${database.version}`,
              options: { autoIncrement: true, keyPath: "passwordId" },
              indexOptions: [
                {
                  keyPath: "passwordId",
                  name: "passwordId",
                  options: { unique: true },
                },
              ],
            });

            break;

          case 2:
            break;
        }
      },
      onSuccessCallback: async () => {
        const { ok, data, error } = await retrieveRow<PasswordInformation[]>({
          storeName: "test-store-1",
        });
        if (!ok) return console.log(error);
        setPasswords(data ?? passwords);
      },
    });
  }, []);

  async function onSubmit(form: PasswordInformation) {
    if (selectedPassword && selectedPassword.passwordId) {
      // Update row.
      const { ok: updateRowOk, error: updateRowError } =
        await updateRowById<PasswordInformation>({
          storeName: "test-store-1",
          id: selectedPassword.passwordId,
          data: { ...form },
        });

      // Has problem?
      if (!updateRowOk) return console.error(updateRowError);

      // Retrieve row.
      const {
        ok: retrieveRowOk,
        data: retrieveRowData,
        error: retrieveRowError,
      } = await retrieveRow<PasswordInformation>({
        storeName: "test-store-1",
        id: selectedPassword.passwordId,
      });

      // Has problem?
      if (!retrieveRowOk || !retrieveRowData)
        return console.error(retrieveRowError);

      // Set state.
      setPasswords((prev) =>
        prev.map((p) =>
          p.passwordId !== retrieveRowData?.passwordId ? p : retrieveRowData
        )
      );
    } else {
      // Create row.
      const {
        ok: createRowOk,
        error: createRowError,
        data: createRowData,
      } = await createRow<PasswordInformation>({
        storeName: "test-store-1",
        data: { ...form },
      });

      console.log(createRowData);
      // Has problem?
      if (!createRowOk) return console.error(createRowError);

      // Retrieve row.
      const {
        ok: retrieveOk,
        data: retrieveData,
        error: retrieveError,
      } = await retrieveRow<PasswordInformation[]>({
        storeName: "test-store-1",
      });
      // Has problem?
      if (!retrieveOk) return console.error(retrieveError);

      // Set passwords.
      setPasswords(retrieveData ?? passwords);

      // Clear input fields.
      reset();
    }
  }

  async function onRetrievePasswordClick(passwordId: number | undefined) {
    if (!passwordId) return;

    const { ok, data, error } = await retrieveRow<PasswordInformation>({
      storeName: "test-store-1",
      id: passwordId,
    });
    if (!ok) return console.error(error);
    setSelectedPassword(data);
  }

  async function onRemovePasswordClick(passwordId: number | undefined) {
    if (!passwordId) return;

    const { ok, error } = await deleteRowById({
      storeName: "test-store-1",
      id: passwordId,
    });

    if (!ok) return console.error(error);

    setPasswords((prev) =>
      prev.filter((password) => password.passwordId !== passwordId)
    );
  }

  function onReleaseClick() {
    setSelectedPassword(undefined);
  }

  useEffect(() => {
    if (selectedPassword) {
      setValue("passwordId", selectedPassword.passwordId);
      setValue("title", selectedPassword.title);
      setValue("userId", selectedPassword.userId);
      setValue("password", selectedPassword.password);
    } else {
      reset();
    }
  }, [selectedPassword]);

  return (
    <section className="flex flex-col justify-center items-center h-full">
      <div className="flex items-center gap-2">
        <h1 className="text-red-500">Indexed DB</h1>
        {selectedPassword ? (
          <button onClick={onReleaseClick}>clear</button>
        ) : null}
      </div>

      <div className="">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
          {selectedPassword ? (
            <input
              className="border rounded-md p-2"
              type="text"
              placeholder="password id"
              disabled
              {...register("passwordId")}
            />
          ) : null}
          <input
            className="border rounded-md p-2"
            type="text"
            placeholder="title"
            {...register("title", { required: "Title is required." })}
          />
          <input
            className="border rounded-md p-2"
            type="text"
            placeholder="user id"
            {...register("userId", { required: "User id is required." })}
          />
          <input
            className="border rounded-md p-2"
            type="password"
            placeholder="password"
            {...register("password", { required: "Password id is required." })}
          />
          <button type="submit">Submit</button>
        </form>
      </div>

      <div className="">
        {passwords.map(({ passwordId, title, userId, password }) => (
          <li className="flex items-center gap-2" key={passwordId}>
            <div
              onClick={() => onRetrievePasswordClick(passwordId)}
              className="flex items-center gap-1 border rounded-md p-2 cursor-pointer"
            >
              <span>{title}</span>
            </div>
            <button onClick={() => onRemovePasswordClick(passwordId)}>x</button>
          </li>
        ))}
      </div>
    </section>
  );
}
