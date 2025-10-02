import { useState } from "react";
import { toast } from "sonner";
import { SUPABASE_BUCKET, SUPABASE_PHOTOS_TABLE } from "../config";
import { supabase } from "../supabaseClient";

export default function UploadPhoto() {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;

            setUploading(true);

            const files = Array.from(e.target.files);

            for (const file of files) {
                const filePath = `${Date.now()}-${file.name}`;

                const { data, error: uploadError } = await supabase.storage
                    .from(SUPABASE_BUCKET)
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: publicData } = supabase.storage
                    .from(SUPABASE_BUCKET)
                    .getPublicUrl(data.path);

                const { error: insertError } = await supabase
                    .from(SUPABASE_PHOTOS_TABLE)
                    .insert([
                        {
                            name: data.path,
                            url: publicData.publicUrl,
                            guest_name: "Invitado",
                        },
                    ]);

                if (insertError) throw insertError;
            }

            toast.success("Fotos subidas con éxito 🎉");
        } catch (err) {
            console.error(err);
            toast.error("❌ Error al subir las fotos");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    return (
        <div className="p-4">
            <label className="block">
                <span className="sr-only">Subir fotos</span>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-pink-50 file:text-pink-700
                     hover:file:bg-pink-100"
                />
            </label>
            {uploading && <p className="text-sm text-gray-400">Subiendo...</p>}
        </div>
    );
}
