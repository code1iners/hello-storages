import StorageList from "@/components/storages/storage-list";
import StorageContents from "@/components/storages/storage-contents";
import "@/App.css";

function App() {
  return (
    <div className="main__container">
      <article className="storage__container">
        <StorageList />
        <StorageContents />
      </article>
    </div>
  );
}

export default App;
