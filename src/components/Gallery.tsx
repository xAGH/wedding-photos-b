import { useEffect, useState } from "react";
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
        fetchPhotos();
    }, [page]);

    const handleDelete = async () => {
        if (password !== PASSWORD || !deleteTarget) {
            alert("❌ Contraseña incorrecta");
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
                alert("Error eliminando en la base de datos. Revisa políticas (RLS).");
                return;
            }

            if (!dbData || dbData.length === 0) {
                console.warn("No se eliminó ninguna fila (dbData vacío). Verifica RLS/policies.");
                const { data: still, error: stillErr } = await supabase
                    .from(SUPABASE_PHOTOS_TABLE)
                    .select("*")
                    .eq("id", deleteTarget.id);
                console.log("🔎 fila tras intento delete:", still, "err:", stillErr);
                alert("No se eliminó la fila: probablemente las políticas (RLS) impiden borrar.");
                return;
            }

            console.log("✅ Eliminado de tabla:", dbData);

            const { data: storageData, error: storageError } = await supabase.storage
                .from(SUPABASE_BUCKET)
                .remove([deleteTarget.name]);

            if (storageError) {
                console.error("Error eliminando del storage (pero DB ya borrada):", storageError);
                alert("Fila eliminada, pero hubo un problema borrando el archivo del storage.");
            } else {
                console.log("✅ Eliminado de storage:", storageData);
            }

            setShowModal(false);
            setPassword("");
            setDeleteTarget(null);
            fetchPhotos();
        } catch (err) {
            console.error("handleDelete error:", err);
            alert("Ocurrió un error inesperado. Revisa la consola.");
        }
    };


    return (
        <div className="w-full">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                {photos.map((p) => (
                    <div
                        key={p.id}
                        className="relative group w-48 h-48 mx-auto"
                    >
                        <img
                            src={p.url}
                            alt={p.name}
                            className="w-48 h-48 object-cover rounded-lg shadow-md"
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
            <div className="flex justify-center gap-4 my-4">
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
                        setPage((p) => (p + 1 < Math.ceil(total / PAGE_SIZE) ? p + 1 : p))
                    }
                    disabled={(page + 1) * PAGE_SIZE >= total}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                    Siguiente →
                </button>
            </div>

            {/* Modal eliminar */}
            {showModal && deleteTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                        <h2 className="text-lg font-bold text-red-600">Eliminar foto</h2>
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
