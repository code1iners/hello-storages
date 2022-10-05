import { useEffect, useState } from "react";
import { useIndexedDatabase } from "@/libs/storage-helpers/use-indexed-database";

export default function IndexedDb() {
  const { getRequest } = useIndexedDatabase({
    databaseName: "custom-database",
    databaseVersion: 1,
  });

  return <div>Indexed DB</div>;
}
