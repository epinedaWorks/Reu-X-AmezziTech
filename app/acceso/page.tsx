"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleAlert, LoaderCircle, LogIn } from "lucide-react";

export default function Acceso() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const r = await fetch("/api/acceso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, clave }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "No se pudo iniciar sesión.");
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setEnviando(false);
    }
  }

  const campo =
    "w-full border border-borde bg-white px-3 py-2 text-[14px] text-tinta outline-none transition focus:border-marca focus:ring-2 focus:ring-marca/10";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-fondo p-4">
      <div className="w-full max-w-sm border border-borde bg-white shadow-[0_1px_3px_rgba(16,24,40,0.06)]">
        <div className="flex items-center gap-3 border-b border-linea px-6 py-5">
          <div className="grid h-10 w-10 shrink-0 place-items-center bg-marca font-serif text-[19px] font-bold text-white">R</div>
          <div className="leading-tight">
            <p className="text-[22px] font-bold tracking-tight text-marca">Reu-X</p>
            <p className="text-[12.5px] text-tenue">Actas y minutas de reunión</p>
          </div>
        </div>

        <form onSubmit={entrar} className="space-y-4 px-6 py-6">
          <h1 className="font-serif text-[20px] font-semibold text-marca">Iniciar sesión</h1>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-tenue">Usuario</span>
            <input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" autoFocus required className={campo} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-tenue">Contraseña</span>
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoComplete="current-password"
              required
              className={campo}
            />
          </label>
          {error && (
            <p role="alert" className="flex items-start gap-2 border border-peligro/30 bg-peligro/5 px-3 py-2 text-[13px] text-peligro">
              <CircleAlert size={16} className="mt-0.5 shrink-0" /> {error}
            </p>
          )}
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex w-full items-center justify-center gap-2 bg-marca py-2.5 text-[14px] font-semibold text-white transition hover:bg-marca-hover disabled:opacity-50"
          >
            {enviando ? <LoaderCircle size={16} className="animate-spin" /> : <LogIn size={16} />} Entrar
          </button>
        </form>
      </div>

      <div className="mt-6 text-center">
        <p className="text-[17px] font-bold tracking-tight text-marca">
          Amezzi <span className="text-acento">Tech</span>
        </p>
        <p className="text-[12px] text-tenue">by Ing. Erick J. Pineda Amézquita</p>
      </div>
    </div>
  );
}
