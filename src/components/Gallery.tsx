import { useEffect, useState } from "react";
import { BUCKET } from "../config";
import { client } from "../supabase";

interface Photo {
    name: string;
    url: string;
}

export default function Gallery() {
    const [photos, setPhotos] = useState<Photo[]>([]);

    useEffect(() => {
        const fetchPhotos = async () => {
            const { data, error } = await client.storage
                .from(BUCKET)
                .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });

            if (error) {
                console.error("Error al listar:", error.message);
                return;
            }

            const urls = data.map((file) => ({
                name: file.name,
                url: client.storage.from(BUCKET).getPublicUrl(file.name).data.publicUrl,
            }));

            setPhotos(urls);
        };

        fetchPhotos();
    }, []);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
            {photos.map((p) => (
                <img
                    key={p.name}
                    src={p.url}
                    alt={p.name}
                    className="w-full h-40 object-cover rounded-lg shadow"
                />
            ))}
        </div>
    );
}
