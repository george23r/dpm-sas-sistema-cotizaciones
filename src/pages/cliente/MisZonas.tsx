import { useNavigate } from "react-router-dom";
import { MapPin, Ruler, Leaf, CalendarClock } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { TIPOS_VEGETACION } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HuTag } from "@/components/shared/HuTag";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatFecha } from "@/lib/utils";

export function MisZonas() {
  const { zonas, clienteActualId } = useApp();
  const navigate = useNavigate();
  const misZonas = zonas.filter((z) => z.clienteId === clienteActualId);

  return (
    <div className="relative space-y-5">
      <HuTag id="HU-02" />
      <div>
        <h1 className="font-heading text-xl font-semibold text-ink sm:text-2xl">Mis zonas verdes</h1>
        <p className="text-sm text-muted">Predios registrados y su próximo servicio programado.</p>
      </div>

      {misZonas.length === 0 ? (
        <EmptyState
          icon={Leaf}
          title="Aún no tienes zonas registradas"
          description="Comunícate con DPM SAS para registrar tu primer predio."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {misZonas.map((zona) => (
            <Card key={zona.id} className="flex flex-col transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>{zona.nombre}</CardTitle>
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <MapPin className="size-3.5" />
                  {zona.direccion}
                </p>
              </CardHeader>
              <CardContent className="flex-1 space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted">
                    <Ruler className="size-4" /> Área
                  </span>
                  <span className="font-medium text-ink">{zona.areaM2.toLocaleString("es-CO")} m²</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted">
                    <Leaf className="size-4" /> Vegetación
                  </span>
                  <span className="font-medium text-ink">{TIPOS_VEGETACION[zona.tipoVegetacion]}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted">
                    <CalendarClock className="size-4" /> Próximo servicio
                  </span>
                  <span className="font-medium text-ink">
                    {zona.proximoServicio ? formatFecha(zona.proximoServicio) : "Sin programar"}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() =>
                    navigate("/app/cliente/cotizaciones/nueva", { state: { zonaId: zona.id } })
                  }
                >
                  Solicitar cotización
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
