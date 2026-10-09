"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Gauge, LogOut, Server, UsersRound } from "lucide-react";

type Yo = { usuario: string; nombre: string; nombreRol: string; limiteDiario: number; usadasHoy: number };

// Rol de la sesión según la cookie visible (solo para adaptar la interfaz).
function useRol(): string | null {
  return useSyncExternalStore(
    () => () => {},
    () => document.cookie.match(/(?:^|; )reux_activa=([^;]+)/)?.[1] ?? null,
    () => null,
  );
}

export function Firma({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-[15px] font-bold leading-tight tracking-tight text-marca sm:text-[17px]">
        Amezzi <span className="text-acento">Tech</span>
      </p>
      <p className="text-[10.5px] leading-tight text-tenue sm:text-[12px]">by Ing. Erick J. Pineda Amézquita</p>
    </div>
  );
}

export function BarraSuperior({ acciones, refrescar = 0 }: { acciones?: React.ReactNode; refrescar?: number }) {
  const router = useRouter();
  const rol = useRol();
  const [yo, setYo] = useState<Yo | null>(null);

  // Perfil y uso del día (se vuelve a pedir cuando cambia `refrescar`).
  useEffect(() => {
    if (!rol) return;
    let vigente = true;
    fetch("/api/yo")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => vigente && setYo(d));
    return () => {
      vigente = false;
    };
  }, [rol, refrescar]);

  async function salir() {
    await fetch("/api/acceso", { method: "DELETE" });
    router.replace("/acceso");
  }

  return (
    <header className="no-print flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-borde bg-white px-4 sm:px-6">
      <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center bg-marca font-serif text-[19px] font-bold text-white">R</div>
        <div className="min-w-0 leading-tight">
          <p className="text-[20px] font-bold tracking-tight text-marca sm:text-[22px]">Reu-X</p>
          <p className="hidden truncate text-[12.5px] text-tenue sm:block">Actas y minutas de reunión</p>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-2.5 text-[12.5px] sm:gap-4">
        <span className="hidden items-center gap-1.5 text-tenue xl:inline-flex">
          <Server size={14} /> AWS · us-west-1
        </span>
        {yo && (
          <span className="hidden flex-col items-end leading-tight lg:flex" title={`Sesión: ${yo.usuario}`}>
            <span className="font-semibold text-tinta">{yo.nombre}</span>
            <span className="inline-flex items-center gap-1 text-[11.5px] text-tenue">
              {yo.nombreRol}
              {yo.limiteDiario > 0 && (
                <>
                  {" · "}
                  <Gauge size={12} /> {yo.usadasHoy}/{yo.limiteDiario} hoy
                </>
              )}
            </span>
          </span>
        )}
        {acciones}
        {rol === "admin" && (
          <Link
            href="/admin"
            title="Administrar usuarios"
            className="inline-flex items-center gap-1.5 border border-marca/35 bg-marca-suave/60 px-2.5 py-1.5 font-semibold text-marca shadow-[0_1px_1px_rgba(16,24,40,0.06)] transition hover:border-marca hover:bg-marca hover:text-white"
          >
            <UsersRound size={14} /> <span className="hidden sm:inline">Usuarios</span>
          </Link>
        )}
        <Firma className="border-l border-borde pl-3 text-right sm:pl-4" />
        {rol && (
          <button onClick={salir} title="Cerrar sesión" aria-label="Cerrar sesión" className="text-tenue transition hover:text-marca">
            <LogOut size={18} />
          </button>
        )}
      </div>
    </header>
  );
}
