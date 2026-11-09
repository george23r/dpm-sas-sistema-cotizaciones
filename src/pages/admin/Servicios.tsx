import { useEffect, useState, type FormEvent } from "react";
import { Package, CircleHelp, Pencil, Plus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SERVICIOS_DPM } from "@/types";
import { actualizarServicioApi, crearServicioApi, obtenerServiciosApi, type ServicioApi } from "@/api/catalogos";
import { Card, CardContent } from "@/components/ui/card";
import { HuTag } from "@/components/shared/HuTag";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Servicios() {
  const { modoDemo } = useApp();
  if (modoDemo) return <ServiciosDemo />;
  return <ServiciosApi />;
}

function ServiciosDemo() { return <div className="space-y-5"><HuTag id="HU-01" /><div><h1 className="font-heading text-2xl font-semibold">Catálogo de servicios</h1><p className="text-sm text-muted">Catálogo demostrativo. Unidades y valores definitivos están pendientes de validación con DPM.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{SERVICIOS_DPM.map((nombre) => <Card key={nombre}><CardContent className="space-y-3 p-5"><Package className="size-5 text-primary" /><h2 className="font-semibold">{nombre}</h2><p className="text-sm text-muted">Unidad de cobro: pendiente de validación</p></CardContent></Card>)}</div></div>; }

function ServiciosApi() {
  const [items, setItems] = useState<ServicioApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState({ nombre: "", unidadCobro: "", activo: true });

  const load = () => {
    setLoading(true);
    return obtenerServiciosApi(true).then((response) => setItems(response.data)).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  };
  useEffect(() => { void load(); }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setMessage("");
    try {
      if (editingId) await actualizarServicioApi(editingId, draft);
      else await crearServicioApi(draft);
      setMessage(editingId ? "Servicio actualizado." : "Servicio creado.");
      setEditingId(null); setDraft({ nombre: "", unidadCobro: "", activo: true }); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No fue posible guardar el servicio."); }
  };

  return <div className="space-y-6"><HuTag id="HU-01" /><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Administración · Catálogo</p><h1 className="font-heading text-2xl font-semibold">Servicios DPM</h1><p className="text-sm text-muted">Las unidades y tarifas son datos de desarrollo pendientes de validación con DPM.</p></div></div>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-status-error">{error}</p>}{message && <p role="status" className="rounded-lg bg-soft p-3 text-sm text-primary">{message}</p>}<Card><CardContent className="p-5"><h2 className="font-heading text-lg font-semibold">{editingId ? "Editar servicio" : "Registrar servicio"}</h2><form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-[1fr_220px_auto_auto]"><label className="text-sm text-ink">Nombre<Input required value={draft.nombre} onChange={(event) => setDraft({ ...draft, nombre: event.target.value })} /></label><label className="text-sm text-ink">Unidad de cobro<Input required value={draft.unidadCobro} onChange={(event) => setDraft({ ...draft, unidadCobro: event.target.value })} /></label><label className="flex items-center gap-2 self-end pb-2 text-sm text-ink"><input type="checkbox" checked={draft.activo} onChange={(event) => setDraft({ ...draft, activo: event.target.checked })} /> Activo</label><div className="flex gap-2 self-end"><Button type="submit"><Plus className="size-4" />{editingId ? "Guardar" : "Crear"}</Button>{editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setDraft({ nombre: "", unidadCobro: "", activo: true }); }}>Cancelar</Button>}</div></form></CardContent></Card>{loading ? <p className="text-sm text-muted">Cargando catálogo…</p> : !items.length ? <EmptyState icon={CircleHelp} title="Catálogo sin servicios" description="La API no devolvió servicios configurados." /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <Card key={item.id} className={!item.activo ? "opacity-60" : undefined}><CardContent className="space-y-3 p-5"><div className="flex items-start justify-between gap-3"><Package className="size-5 text-primary" />{!item.activo && <span className="rounded-full bg-app-bg px-2 py-1 text-xs text-muted">Inactivo</span>}</div><h2 className="font-semibold">{item.nombre}</h2><p className="text-sm text-muted">Unidad registrada: <span className="font-medium text-ink">{item.unidad_cobro || "Pendiente"}</span></p><p className="text-xs text-muted">Tarifa: no definida en este catálogo</p><Button type="button" variant="outline" size="sm" onClick={() => { setEditingId(item.id); setDraft({ nombre: item.nombre, unidadCobro: item.unidad_cobro, activo: item.activo }); }}><Pencil className="size-3.5" /> Editar</Button></CardContent></Card>)}</div>}</div>;
}

