import { useEffect, useMemo, useState } from "react";
import { History as HistoryIcon } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EstadoOrdenBadge } from "@/components/shared/EstadoBadge";
import { HuTag } from "@/components/shared/HuTag";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatFechaLarga } from "@/lib/utils";
import { obtenerOrdenesApi, type OrdenApi } from "@/api/operaciones";

export function Historial() {
  const { modoDemo } = useApp();
  if (!modoDemo) return <HistorialApi />;
  return <HistorialDemo />;
}

function HistorialDemo() {
  const { ordenes, cuadrillas, clienteActualId } = useApp();
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const historial = useMemo(() => {
    return ordenes
      .filter((o) => o.clienteId === clienteActualId && o.estado === "finalizado")
      .filter((o) => (desde ? o.fecha >= desde : true))
      .filter((o) => (hasta ? o.fecha <= hasta : true))
      .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  }, [ordenes, clienteActualId, desde, hasta]);

  const nombreCuadrilla = (id: string | null) => cuadrillas.find((c) => c.id === id)?.nombre ?? "Sin asignar";

  return (
    <div className="relative space-y-5">
      <HuTag id="HU-07" />
      <div>
        <h1 className="font-heading text-xl font-semibold text-ink sm:text-2xl">Historial de servicios</h1>
        <p className="text-sm text-muted">Revisa los servicios realizados en tus predios.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="desde">Desde</Label>
            <Input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="hasta">Hasta</Label>
            <Input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
          {(desde || hasta) && (
            <Button
              variant="outline"
              onClick={() => {
                setDesde("");
                setHasta("");
              }}
            >
              Limpiar filtro
            </Button>
          )}
        </CardContent>
      </Card>

      {historial.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="No hay servicios en este rango"
          description="Ajusta el filtro de fechas o consulta más adelante."
        />
      ) : (
        <ol className="relative space-y-4 border-l border-line pl-5">
          {historial.map((orden) => (
            <li key={orden.id} className="relative">
              <span className="absolute -left-[26px] top-1.5 size-2.5 rounded-full border-2 border-surface bg-primary" />
              <Card>
                <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      {formatFechaLarga(orden.fecha)}
                    </p>
                    <p className="font-heading text-sm font-semibold text-ink">{orden.tipoServicio}</p>
                    <p className="text-xs text-muted">
                      {orden.zonaNombre} · Cuadrilla: {nombreCuadrilla(orden.cuadrillaId)}
                    </p>
                  </div>
                  <EstadoOrdenBadge estado={orden.estado} />
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function HistorialApi(){
 const [rows,setRows]=useState<OrdenApi[]>([]);const [desde,setDesde]=useState("");const [hasta,setHasta]=useState("");const [error,setError]=useState("");
 useEffect(()=>{obtenerOrdenesApi({estado:"finalizada"}).then(r=>setRows(r.data)).catch((e:Error)=>setError(e.message));},[]);
 const filtered=rows.filter(o=>(!desde||o.inicio.slice(0,10)>=desde)&&(!hasta||o.inicio.slice(0,10)<=hasta));
 return <div className="relative space-y-5"><HuTag id="HU-07"/><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Portal cliente</p><h1 className="font-heading text-xl font-semibold text-ink sm:text-2xl">Historial de servicios</h1><p className="text-sm text-muted">Solo se muestran servicios finalizados de tu cuenta.</p></div><Card><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end"><div className="flex flex-1 flex-col gap-1.5"><Label htmlFor="api-desde">Desde</Label><Input id="api-desde" type="date" value={desde} onChange={e=>setDesde(e.target.value)}/></div><div className="flex flex-1 flex-col gap-1.5"><Label htmlFor="api-hasta">Hasta</Label><Input id="api-hasta" type="date" value={hasta} onChange={e=>setHasta(e.target.value)}/></div></CardContent></Card>{error&&<p role="alert" className="text-status-error">{error}</p>}{!filtered.length?<EmptyState icon={HistoryIcon} title="No hay servicios finalizados" description="Aún no hay servicios para mostrar en este periodo."/>:<ol className="relative space-y-4 border-l border-line pl-5">{filtered.map(o=><li key={o.id} className="relative"><span className="absolute -left-[26px] top-1.5 size-2.5 rounded-full border-2 border-surface bg-primary"/><Card><CardContent className="space-y-1 p-4"><p className="text-xs uppercase tracking-wide text-muted">{formatFechaLarga(o.inicio.slice(0,10))}</p><p className="font-heading text-sm font-semibold">{o.tipo_servicio}</p><p className="text-xs text-muted">{o.zona} · Cuadrilla: {o.cuadrilla??"Sin asignar"}</p>{o.nota_finalizacion&&<p className="text-sm">Nota: {o.nota_finalizacion}</p>}</CardContent></Card></li>)}</ol>}</div>;
}
