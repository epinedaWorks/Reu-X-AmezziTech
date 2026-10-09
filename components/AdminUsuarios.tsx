"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CircleAlert, KeyRound, LoaderCircle, Pencil, RotateCcw, ShieldCheck, Trash, UserPlus, X } from "lucide-react";
import { BarraSuperior } from "./BarraSuperior";

type Rol = "admin" | "usuario" | "participante";
type Usuario = {
  usuario: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  limiteDiario: number;
  maxMB: number;
  creado: string;
  uso: { fecha: string; minutas: number };
};

const ROLES: { id: Rol; nombre: string; descripcion: string; limiteDiario: number; maxMB: number }[] = [
  { id: "participante", nombre: "Participante", descripcion: "Acceso fácil para asistentes; con límites de uso.", limiteDiario: 20, maxMB: 300 },
  { id: "usuario", nombre: "Usuario", descripcion: "Uso completo de la aplicación.", limiteDiario: 0, maxMB: 0 },
  { id: "admin", nombre: "Administrador", descripcion: "Uso completo y administración de usuarios.", limiteDiario: 0, maxMB: 0 },
];
const NOMBRE_ROL = Object.fromEntries(ROLES.map((r) => [r.id, r.nombre])) as Record<Rol, string>;

type Formulario = { usuario: string; nombre: string; rol: Rol; limiteDiario: number; maxMB: number; clave: string; activo: boolean };
const NUEVO: Formulario = { usuario: "", nombre: "", rol: "participante", limiteDiario: 20, maxMB: 300, clave: "", activo: true };

const hoy = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Guatemala" });

async function api<T>(url: string, metodo: string, cuerpo?: unknown): Promise<T> {
  const r = await fetch(url, {
    method: metodo,
    headers: cuerpo ? { "Content-Type": "application/json" } : undefined,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? `Error ${r.status}`);
  return d as T;
}

export function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null); // null = nuevo
  const [form, setForm] = useState<Formulario>(NUEVO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const d = await api<{ usuarios: Usuario[]; principal: string | null }>("/api/usuarios", "GET");
      setUsuarios(d.usuarios.sort((a, b) => a.usuario.localeCompare(b.usuario)));
      setPrincipal(d.principal);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    queueMicrotask(cargar);
  }, [cargar]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 2500);
    return () => clearTimeout(t);
  }, [aviso]);

  function nuevo() {
    setEditando(null);
    setForm(NUEVO);
    setError(null);
  }

  function editar(u: Usuario) {
    setEditando(u.usuario);
    setForm({ usuario: u.usuario, nombre: u.nombre, rol: u.rol, limiteDiario: u.limiteDiario, maxMB: u.maxMB, clave: "", activo: u.activo });
    setError(null);
  }

  function elegirRol(rol: Rol) {
    // Al crear, cada perfil propone sus límites; al editar se respetan los actuales.
    const r = ROLES.find((x) => x.id === rol)!;
    setForm((f) => (editando ? { ...f, rol } : { ...f, rol, limiteDiario: r.limiteDiario, maxMB: r.maxMB }));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      if (editando) {
        const cambios: Record<string, unknown> = {
          nombre: form.nombre, rol: form.rol, limiteDiario: form.limiteDiario, maxMB: form.maxMB, activo: form.activo,
        };
        if (form.clave) cambios.clave = form.clave;
        await api(`/api/usuarios/${encodeURIComponent(editando)}`, "PATCH", cambios);
        setAviso("Cambios guardados");
        setForm((f) => ({ ...f, clave: "" }));
      } else {
        await api("/api/usuarios", "POST", form);
        setAviso(`Usuario "${form.usuario}" creado`);
        setEditando(form.usuario.trim().toLowerCase());
        setForm((f) => ({ ...f, clave: "" }));
      }
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGuardando(false);
    }
  }

  async function accion(fn: () => Promise<unknown>, mensaje: string) {
    setError(null);
    try {
      await fn();
      setAviso(mensaje);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const campo =
    "w-full border border-borde bg-white px-2.5 py-1.5 text-[13.5px] text-tinta outline-none transition focus:border-marca focus:ring-2 focus:ring-marca/10 disabled:bg-fondo disabled:text-tenue";
  const etiqueta = "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-tenue";
  const usadasHoy = (u: Usuario) => (u.uso.fecha === hoy() ? u.uso.minutas : 0);

  return (
    <div className="flex h-dvh flex-col">
      <BarraSuperior />

      <div className="no-print flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-borde bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" title="Volver a Reu-X" className="text-tenue hover:text-marca">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-serif text-[21px] font-semibold text-marca">Administración de usuarios</h1>
        </div>
        <button
          onClick={nuevo}
          className="inline-flex items-center gap-1.5 border border-marca bg-marca px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-marca-hover"
        >
          <UserPlus size={15} /> Nuevo usuario
        </button>
      </div>

      <main className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Lista */}
        <section className="panel-scroll min-h-0 overflow-auto p-4 sm:p-6">
          <table className="w-full min-w-[640px] border-collapse border border-borde bg-white text-[13.5px]">
            <thead>
              <tr className="bg-marca-suave text-left text-[11px] uppercase tracking-wider text-marca">
                <th className="px-3 py-2 font-semibold">Usuario</th>
                <th className="px-3 py-2 font-semibold">Perfil</th>
                <th className="px-3 py-2 font-semibold">Estado</th>
                <th className="px-3 py-2 font-semibold">Uso hoy</th>
                <th className="px-3 py-2 font-semibold">Archivo máx.</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {principal && (
                <tr className="border-t border-linea bg-fondo/60">
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{principal}</p>
                    <p className="text-[12px] text-tenue">Administrador principal (Parameter Store)</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1 text-marca">
                      <ShieldCheck size={14} /> Administrador
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-exito">Activo</td>
                  <td className="px-3 py-2.5 text-tenue">Sin límite</td>
                  <td className="px-3 py-2.5 text-tenue">2 GB</td>
                  <td />
                </tr>
              )}
              {usuarios?.map((u) => (
                <tr key={u.usuario} className={`border-t border-linea ${editando === u.usuario ? "bg-marca-suave/40" : ""}`}>
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{u.usuario}</p>
                    {u.nombre !== u.usuario && <p className="text-[12px] text-tenue">{u.nombre}</p>}
                  </td>
                  <td className="px-3 py-2.5">{NOMBRE_ROL[u.rol]}</td>
                  <td className={`px-3 py-2.5 ${u.activo ? "text-exito" : "text-peligro"}`}>{u.activo ? "Activo" : "Inactivo"}</td>
                  <td className="px-3 py-2.5 tabular-nums">
                    {usadasHoy(u)}
                    {u.limiteDiario > 0 ? ` / ${u.limiteDiario}` : " · sin límite"}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{u.maxMB > 0 ? `${u.maxMB} MB` : "2 GB"}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => editar(u)} className="inline-flex items-center gap-1 font-semibold text-marca hover:underline">
                      <Pencil size={13} /> Editar
                    </button>
                  </td>
                </tr>
              ))}
              {usuarios === null && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-tenue">
                    <LoaderCircle size={16} className="mr-2 inline animate-spin" /> Cargando usuarios…
                  </td>
                </tr>
              )}
              {usuarios?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-tenue">Aún no hay usuarios. Cree el primero con “Nuevo usuario”.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Formulario */}
        <aside className="panel-scroll min-h-0 overflow-auto border-t border-borde bg-white lg:border-l lg:border-t-0">
          <form onSubmit={guardar} className="space-y-3.5 p-5">
            <div className="flex items-baseline justify-between border-b border-linea pb-2">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-marca">
                {editando ? `Editar: ${editando}` : "Nuevo usuario"}
              </h2>
              {editando && (
                <button type="button" onClick={nuevo} className="text-tenue hover:text-marca" aria-label="Cancelar edición">
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className={etiqueta}>Usuario</span>
                <input
                  value={form.usuario}
                  onChange={(e) => setForm({ ...form, usuario: e.target.value.toLowerCase() })}
                  disabled={Boolean(editando)}
                  required
                  placeholder="gatoleon"
                  autoComplete="off"
                  className={campo}
                />
              </label>
              <label>
                <span className={etiqueta}>Nombre</span>
                <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Participantes del taller" className={campo} />
              </label>
            </div>

            <fieldset>
              <legend className={etiqueta}>Perfil</legend>
              <div className="space-y-1.5">
                {ROLES.map((r) => (
                  <label
                    key={r.id}
                    className={`flex cursor-pointer gap-2.5 border px-3 py-2 transition ${form.rol === r.id ? "border-marca bg-marca-suave/50" : "border-borde hover:border-marca/40"}`}
                  >
                    <input type="radio" name="rol" checked={form.rol === r.id} onChange={() => elegirRol(r.id)} className="mt-1 accent-[#1b2a41]" />
                    <span>
                      <span className="block text-[13.5px] font-semibold text-tinta">{r.nombre}</span>
                      <span className="block text-[12px] text-tenue">{r.descripcion}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className={etiqueta}>Minutas por día</span>
                <input
                  type="number"
                  min={0}
                  value={form.limiteDiario}
                  onChange={(e) => setForm({ ...form, limiteDiario: Number(e.target.value) })}
                  className={campo}
                />
                <span className="mt-0.5 block text-[11px] text-tenue">0 = sin límite</span>
              </label>
              <label>
                <span className={etiqueta}>Archivo máx. (MB)</span>
                <input type="number" min={0} value={form.maxMB} onChange={(e) => setForm({ ...form, maxMB: Number(e.target.value) })} className={campo} />
                <span className="mt-0.5 block text-[11px] text-tenue">0 = hasta 2 GB</span>
              </label>
            </div>

            <label className="block">
              <span className={etiqueta}>{editando ? "Nueva contraseña (opcional)" : "Contraseña"}</span>
              <div className="relative">
                <KeyRound size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tenue" />
                <input
                  type="text"
                  value={form.clave}
                  onChange={(e) => setForm({ ...form, clave: e.target.value })}
                  required={!editando}
                  minLength={8}
                  autoComplete="new-password"
                  placeholder={editando ? "Dejar vacío para no cambiarla" : "Mínimo 8 caracteres"}
                  className={`${campo} pl-8`}
                />
              </div>
            </label>

            {editando && (
              <label className="flex cursor-pointer items-center gap-2 text-[13.5px]">
                <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} className="accent-[#1b2a41]" />
                Usuario activo (puede iniciar sesión)
              </label>
            )}

            {error && (
              <p role="alert" className="flex items-start gap-2 border border-peligro/30 bg-peligro/5 px-3 py-2 text-[13px] text-peligro">
                <CircleAlert size={16} className="mt-0.5 shrink-0" /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={guardando}
              className="inline-flex w-full items-center justify-center gap-2 bg-marca py-2.5 text-[14px] font-semibold text-white transition hover:bg-marca-hover disabled:opacity-50"
            >
              {guardando && <LoaderCircle size={15} className="animate-spin" />}
              {editando ? "Guardar cambios" : "Crear usuario"}
            </button>

            {editando && (
              <div className="flex gap-2 text-[12.5px]">
                <button
                  type="button"
                  onClick={() =>
                    accion(() => api(`/api/usuarios/${encodeURIComponent(editando)}`, "PATCH", { reiniciarUso: true }), "Uso de hoy reiniciado")
                  }
                  className="inline-flex flex-1 items-center justify-center gap-1.5 border border-marca/35 bg-marca-suave/60 py-1.5 font-semibold text-marca transition hover:bg-marca hover:text-white"
                >
                  <RotateCcw size={13} /> Reiniciar uso de hoy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm(`¿Eliminar el usuario "${editando}"? Esta acción no se puede deshacer.`)) return;
                    accion(() => api(`/api/usuarios/${encodeURIComponent(editando)}`, "DELETE"), "Usuario eliminado").then(nuevo);
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 border border-peligro/40 bg-peligro/5 py-1.5 font-semibold text-peligro transition hover:bg-peligro hover:text-white"
                >
                  <Trash size={13} /> Eliminar
                </button>
              </div>
            )}
          </form>
        </aside>
      </main>

      {aviso && (
        <div className="no-print fixed bottom-6 left-1/2 -translate-x-1/2 bg-marca px-4 py-2 text-[13px] text-white shadow-lg">{aviso}</div>
      )}
    </div>
  );
}
