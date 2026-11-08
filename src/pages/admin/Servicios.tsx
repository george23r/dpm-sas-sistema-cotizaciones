import { useEffect, useState } from "react";
import { Package, CircleHelp } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SERVICIOS_DPM } from "@/types";
import { obtenerServiciosApi, type ServicioApi } from "@/api/catalogos";
import { Card, CardContent } from "@/components/ui/card";
import { HuTag } from "@/components/shared/HuTag";
import { EmptyState } from "@/components/shared/EmptyState";

export function Servicios() {
  const { modoDemo } = useApp();
  if (modoDemo) return <ServiciosDemo />;
  return <ServiciosApi />;
}

function ServiciosDemo() { return <div className="space-y-5"><HuTag id="HU-01" /><div><h1 className="font-heading text-2xl font-semibold">Catálogo de servicios</h1><p className="text-sm text-muted">Catálogo demostrativo. Unidades y valores definitivos están pendientes de validación con DPM.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{SERVICIOS_DPM.map((nombre) => <Card key={nombre}><CardContent className="space-y-3 p-5"><Package className="size-5 text-primary" /><h2 className="font-semibold">{nombre}</h2><p className="text-sm text-muted">Unidad de cobro: pendiente de validación</p></CardContent></Card>)}</div></div>; }

function ServiciosApi() {
  const [items, setItems] = useState<ServicioApi[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { obtenerServiciosApi().then((response) => setItems(response.data)).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false)); }, []);
  return <div className="space-y-5"><HuTag id="HU-01" /><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Administración · Catálogo</p><h1 className="font-heading text-2xl font-semibold">Servicios DPM</h1><p className="text-sm text-muted">Consulta del catálogo activo. No se muestran tarifas ni valores no confirmados.</p></div>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-status-error">{error}</p>}{loading ? <p className="text-sm text-muted">Cargando catálogo…</p> : !items.length ? <EmptyState icon={CircleHelp} title="Catálogo sin servicios activos" description="La API no devolvió servicios configurados." /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <Card key={item.id}><CardContent className="space-y-3 p-5"><Package className="size-5 text-primary" /><h2 className="font-semibold">{item.nombre}</h2><p className="text-sm text-muted">Unidad de cobro: <span className="font-medium text-ink">{item.unidad_cobro || "Pendiente"}</span></p><p className="text-xs text-muted">Tarifa: no definida en este catálogo</p></CardContent></Card>)}</div>}</div>;
}
