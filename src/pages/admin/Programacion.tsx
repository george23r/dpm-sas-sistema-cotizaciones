import { useMemo, useState } from "react";
import { Plus, AlertTriangle, Clock } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { HuTag } from "@/components/shared/HuTag";
import { EstadoOrdenBadge } from "@/components/shared/EstadoBadge";
import { cn } from "@/lib/utils";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function obtenerDiasSemana(ancla: Date): Date[] {
  const dia = ancla.getDay();
  const offset = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(ancla);
  lunes.setDate(ancla.getDate() + offset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });
}

function obtenerDiasMes(ancla: Date): Date[] {
  const inicioMes = new Date(ancla.getFullYear(), ancla.getMonth(), 1);
  const diaSemanaInicio = inicioMes.getDay() === 0 ? 6 : inicioMes.getDay() - 1;
  const inicioGrid = new Date(inicioMes);
  inicioGrid.setDate(inicioMes.getDate() - diaSemanaInicio);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inicioGrid);
    d.setDate(inicioGrid.getDate() + i);
    return d;
  });
}

function aISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

const HOY = new Date();

export function Programacion() {
  const { ordenes, cuadrillas, crearOrden } = useApp();
  const [dialogAbierto, setDialogAbierto] = useState(false);

  const diasSemana = useMemo(() => obtenerDiasSemana(HOY), []);
  const diasMes = useMemo(() => obtenerDiasMes(HOY), []);

  const nombreCuadrilla = (id: string | null) => cuadrillas.find((c) => c.id === id)?.nombre ?? "Sin asignar";

  return (
    <div className="relative space-y-5">
      <HuTag id="HU-03" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-ink sm:text-2xl">Programar mantenimiento</h1>
          <p className="text-sm text-muted">Visualiza y programa servicios por semana o por mes.</p>
        </div>
        <Button onClick={() => setDialogAbierto(true)}>
          <Plus className="size-4" />
          Programar servicio
        </Button>
      </div>

      <Tabs defaultValue="semana">
        <TabsList>
          <TabsTrigger value="semana">Semana</TabsTrigger>
          <TabsTrigger value="mes">Mes</TabsTrigger>
        </TabsList>

        <TabsContent value="semana">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {diasSemana.map((dia) => {
              const iso = aISO(dia);
              const ordenesDelDia = ordenes.filter((o) => o.fecha === iso).sort((a, b) => (a.horaInicio < b.horaInicio ? -1 : 1));
              const esHoy = iso === aISO(HOY);
              return (
                <Card key={iso} className={cn(esHoy && "border-primary ring-1 ring-primary/30")}>
                  <CardContent className="space-y-2 p-3.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {DIAS_SEMANA[dia.getDay() === 0 ? 6 : dia.getDay() - 1]} {dia.getDate()}
                    </p>
                    {ordenesDelDia.length === 0 ? (
                      <p className="py-3 text-center text-xs text-muted">Sin servicios</p>
                    ) : (
                      ordenesDelDia.map((o) => (
                        <div key={o.id} className="rounded-[var(--radius-btn)] border border-line bg-app-bg p-2.5">
                          <p className="flex items-center gap-1 text-[11px] font-medium text-muted">
                            <Clock className="size-3" />
                            {o.horaInicio} - {o.horaFin}
                          </p>
                          <p className="text-xs font-medium text-ink leading-snug">{o.tipoServicio}</p>
                          <p className="text-[11px] text-muted">{nombreCuadrilla(o.cuadrillaId)}</p>
                          <div className="mt-1">
                            <EstadoOrdenBadge estado={o.estado} />
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="mes">
          <Card>
            <CardContent className="p-3.5">
              <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
                {DIAS_SEMANA.map((d) => (
                  <div key={d} className="py-1.5">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {diasMes.map((dia) => {
                  const iso = aISO(dia);
                  const delMismoMes = dia.getMonth() === HOY.getMonth();
                  const ordenesDelDia = ordenes.filter((o) => o.fecha === iso);
                  const esHoy = iso === aISO(HOY);
                  return (
                    <div
                      key={iso}
                      className={cn(
                        "flex min-h-20 flex-col gap-1 rounded-[var(--radius-btn)] border border-line p-1.5 text-xs",
                        delMismoMes ? "bg-surface" : "bg-app-bg/60 text-muted/60",
                        esHoy && "border-primary ring-1 ring-primary/30",
                      )}
                    >
                      <span className={cn("font-medium", delMismoMes ? "text-ink" : "text-muted/60")}>
                        {dia.getDate()}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {ordenesDelDia.slice(0, 3).map((o) => (
                          <span
                            key={o.id}
                            title={o.tipoServicio}
                            className="size-1.5 rounded-full bg-primary"
                          />
                        ))}
                        {ordenesDelDia.length > 3 && (
                          <span className="text-[10px] text-muted">+{ordenesDelDia.length - 3}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DialogProgramarServicio
        abierto={dialogAbierto}
        onCerrar={() => setDialogAbierto(false)}
        onProgramar={crearOrden}
      />
    </div>
  );
}

function DialogProgramarServicio({
  abierto,
  onCerrar,
  onProgramar,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onProgramar: ReturnType<typeof useApp>["crearOrden"];
}) {
  const { clientes, zonas, cuadrillas, cotizaciones, ordenes } = useApp();
  const aceptadas = cotizaciones.filter(c=>c.estado==="aceptada");
  const [cotizacionId,setCotizacionId]=useState(aceptadas[0]?.id??"");
  const cotizacion=aceptadas.find(c=>c.id===cotizacionId);
  const cliente=clientes.find(c=>c.id===cotizacion?.clienteId);
  const zona=zonas.find(z=>z.id===cotizacion?.zonaId);
  const [fecha,setFecha]=useState(new Date().toLocaleDateString("en-CA",{timeZone:"America/Bogota"}));
  const [horaInicio,setHoraInicio]=useState("08:00");
  const [horaFin,setHoraFin]=useState("10:00");
  const [cuadrillaId,setCuadrillaId]=useState("");
  const [error,setError]=useState<string|null>(null);
  const disponibles=aceptadas.filter(c=>!ordenes.some(o=>o.cotizacionId===c.id&&o.estado!=="finalizado"));
  const limpiarYCerrar = () => {
    setError(null);
    onCerrar();
  };

  const onSubmit=(e:React.FormEvent)=>{
    e.preventDefault();
    if(!cotizacion||!zona){setError("Selecciona una cotización aceptada.");return;}
    if(horaFin<=horaInicio){setError("La hora de fin debe ser posterior al inicio.");return;}
    const resultado=onProgramar({cotizacionId:cotizacion.id,clienteId:cotizacion.clienteId,zonaId:zona.id,zonaNombre:zona.nombre,direccion:zona.direccion,tipoServicio:cotizacion.servicio,fecha,horaInicio,horaFin,cuadrillaId:cuadrillaId||null});
    if(!resultado.ok){setError(resultado.error);return;}
    limpiarYCerrar();
  };
  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && limpiarYCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Programar servicio</DialogTitle>
          <DialogDescription>Define fecha, horario y cuadrilla responsable.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prog-cot">Cotización aceptada</Label>
            <Select id="prog-cot" value={cotizacionId} onChange={e=>setCotizacionId(e.target.value)}>
              {!aceptadas.length&&<option value="">Sin cotizaciones aceptadas</option>}
              {aceptadas.map(c=><option key={c.id} value={c.id}>{c.id} · {c.objeto}</option>)}
            </Select>
            {!disponibles.length&&aceptadas.length>0&&<p className="text-xs text-muted">Las cotizaciones ya programadas también pueden corresponder a nuevos servicios; revisa antes de duplicar una orden.</p>}
          </div>
          {cotizacion&&<div className="rounded-lg bg-app-bg p-3 text-sm"><p><strong>Cliente:</strong> {cliente?.nombre??"—"}</p><p><strong>Predio:</strong> {zona?.nombre??"—"}</p><p><strong>Servicio:</strong> {cotizacion.servicio}</p></div>}
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">Fecha<Input type="date" value={fecha} onChange={e=>setFecha(e.target.value)}/></label>
            <label className="text-sm">Inicio<Input type="time" value={horaInicio} onChange={e=>setHoraInicio(e.target.value)}/></label>
            <label className="text-sm">Fin<Input type="time" value={horaFin} onChange={e=>setHoraFin(e.target.value)}/></label>
          </div>
          <label className="text-sm">Cuadrilla (puedes asignarla después)
            <Select value={cuadrillaId} onChange={e=>setCuadrillaId(e.target.value)}>
              <option value="">Sin asignar</option>
              {cuadrillas.map(c=><option key={c.id} value={c.id}>{c.nombre} · {c.integrantes} integrantes</option>)}
            </Select>
          </label>
          {error && (
            <p className="flex items-start gap-2 rounded-[var(--radius-btn)] bg-status-error-bg px-3 py-2.5 text-sm text-status-error">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!cotizacion}>Guardar servicio</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
