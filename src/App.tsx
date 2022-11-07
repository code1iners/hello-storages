import StorageList from "@/components/storages/storage-list";
import StorageContents from "@/components/storages/storage-contents";
import "@/App.css";

function App() {
  return (
    <main className="h-screen">
      <header className="h-10 flex items-center justify-center">
        <StorageList />
      </header>

      <section className="h-full">
        <StorageContents />
      </section>
    </main>
  );
}

export default App;
