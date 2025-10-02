import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SUPABASE_BUCKET, SUPABASE_PHOTOS_TABLE } from "../config";
import { supabase } from "../supabaseClient";

interface Photo {
    id: string;
    url: string;
    name: string;
    guest_name: string;
    created_at: string;
}

const PASSWORD = "boda2025";

export default function Gallery() {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Photo | null>(null);
    const [password, setPassword] = useState("");

    const PAGE_SIZE = 12;

    const fetchPhotos = async () => {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, count, error } = await supabase
            .from(SUPABASE_PHOTOS_TABLE)
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(from, to);

        if (!error && data) {
            setPhotos(data);
            setTotal(count || 0);
        }
    };

    useEffect(() => {
        const channel = supabase
            .channel("photos-changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: SUPABASE_PHOTOS_TABLE,
                },
                () => {
                    fetchPhotos();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        fetchPhotos();
    }, [page]);

    const handleDelete = async () => {
        if (password !== PASSWORD || !deleteTarget) {
            toast.error("❌ Contraseña incorrecta");
            return;
        }

        try {
            const { data: dbData, error: dbError } = await supabase
                .from(SUPABASE_PHOTOS_TABLE)
                .delete()
                .eq("id", deleteTarget.id)
                .select();

            if (dbError) {
                console.error("Error eliminando de tabla:", dbError);
                toast.error(
                    "Error eliminando en la base de datos. Revisa políticas (RLS)."
                );
                return;
            }

            if (!dbData || dbData.length === 0) {
                console.warn(
                    "No se eliminó ninguna fila. Verifica RLS/policies."
                );
                toast.error(
                    "No se eliminó la fila: probablemente las políticas (RLS) impiden borrar."
                );
                return;
            }

            const { error: storageError } = await supabase.storage
                .from(SUPABASE_BUCKET)
                .remove([deleteTarget.name]);

            if (storageError) {
                console.error("Error eliminando del storage:", storageError);
                toast.error(
                    "Fila eliminada, pero hubo un problema borrando el archivo del storage."
                );
            }

            setShowModal(false);
            setPassword("");
            setDeleteTarget(null);
        } catch (err) {
            console.error("handleDelete error:", err);
            toast.error("Ocurrió un error inesperado. Revisa la consola.");
        }
    };

    return (
        <div className="w-full">
            {/* Galería responsiva */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3">
                {photos.map((p) => (
                    <div
                        key={p.id}
                        className="relative group w-full aspect-square mx-auto"
                    >
                        <img
                            src={p.url}
                            alt={p.name}
                            className="w-full h-full object-cover rounded-lg shadow-md"
                        />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 rounded">
                            {p.guest_name || "Invitado"}
                        </span>
                        <button
                            onClick={() => {
                                setDeleteTarget(p);
                                setShowModal(true);
                            }}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            {/* Paginación */}
            <div className="flex justify-center gap-4 my-4 text-sm sm:text-base">
                <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                    ← Anterior
                </button>
                <span>
                    Página {page + 1} de {Math.ceil(total / PAGE_SIZE)}
                </span>
                <button
                    onClick={() =>
                        setPage((p) =>
                            p + 1 < Math.ceil(total / PAGE_SIZE) ? p + 1 : p
                        )
                    }
                    disabled={(page + 1) * PAGE_SIZE >= total}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                    Siguiente →
                </button>
            </div>

            {/* Modal eliminar */}
            {showModal && deleteTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm p-6 rounded-lg shadow-md space-y-4">
                        <h2 className="text-lg font-bold text-red-600">
                            Eliminar foto
                        </h2>
                        <p>Ingresa la contraseña para confirmar:</p>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="border rounded px-3 py-2 w-full"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-gray-300 rounded"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
