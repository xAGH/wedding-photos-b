import { Toaster } from "sonner";
import Gallery from "./components/Gallery";
import UploadPhoto from "./components/UploadPhoto";

function App() {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center">
            <h1 className="text-2xl font-bold my-4 text-pink-600">
                📸 Álbum de la Boda
            </h1>
            <UploadPhoto />
            <Gallery />
            <Toaster />
        </div>
    );
}

export default App;
