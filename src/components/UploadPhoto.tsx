import { useState } from "react";
import { BUCKET } from "../config";
import { client } from "../supabase";

export default function UploadPhoto() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);

        const filePath = `${Date.now()}-${file.name}`;
        const { error } = await client.storage
            .from(BUCKET)
            .upload(filePath, file);

        if (error) {
            console.error("Error subiendo archivo:", error.message);
        } else {
            alert("✅ Foto subida con éxito!");
        }

        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="bg-pink-500 text-white px-4 py-2 rounded-lg shadow"
            >
                {loading ? "Subiendo..." : "Subir foto"}
            </button>
        </div>
    );
}
