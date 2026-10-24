# Registro de decisiones técnicas — DPM SAS

| ID | Decisión | Alternativas y justificación | Estado |
|---|---|---|---|
| D-01 | Aplicación web de una sola página con React y TypeScript | Frente a una aplicación móvil nativa, un solo código sirve a escritorio y celular (RNF-01); TypeScript reduce errores en formularios con varios roles | Prototipo hecho |
| D-02 | API REST con Node.js y Express | Mismo lenguaje en cliente y servidor; desacopla la interfaz de los datos | Diseñada |
| D-03 | Base de datos relacional PostgreSQL | Relaciones fuertes (cliente, zona, cotización, orden, cuadrilla) y reglas que exigen integridad y disparadores | Construida y probada |
| D-04 | La cotización se arma por líneas (concepto, cantidad, valor unitario), no con una fórmula por metros cuadrados | La entrevista y el ejemplo de cotización muestran un precio fijo calculado por trabajo y cobrado por unidad (por ejemplo, por árbol) | Hecha |
| D-05 | Una cotización enviada no se modifica y tiene vigencia de 15 días | El ejemplo de cotización fija la vigencia; el precio es fijo para el cliente | Hecha |
| D-06 | El cruce de horarios de una cuadrilla se bloquea con un disparador y bloqueo por cuadrilla | La alternativa declarativa (`EXCLUDE` con `btree_gist`) exige una extensión; el disparador se verificó con pruebas | Hecha, probada |
| D-07 | El control de turnos es un módulo básico de registro y comparación; la factura queda fuera del alcance | La comparación de planillas antes de facturar es un proceso real de DPM SAS; decisión del equipo (24 de octubre de 2026) | Aprobada por el equipo |
| D-08 | El cliente consulta el estado de su solicitud en su panel; no hay notificaciones | Evita un servicio de correos o mensajes fuera del alcance; por confirmar con la profesora | Asumida |
| D-09 | El estado "Incidencia" no se modela; las novedades van en la nota de finalización | Las historias solo definen pendiente, en ejecución y finalizada (HU-04) | Asumida |
| D-10 | Autenticación con JWT, permisos por rol y contraseñas con hash; roles de base de datos de privilegios mínimos | RNF-02 y RNF-04 | Diseñada; roles de BD construidos |
| D-11 | Despliegue en Vercel (frontend), Render (API) y PostgreSQL gestionado | Capas gratuitas suficientes para el alcance académico; falta elegir la base de datos gestionada | Pendiente |
| D-12 | Las variables del objetivo específico 1 se interpretan según la entrevista: unidades de cobro, personal, maquinaria, días, herramientas, combustible y transporte | El objetivo aprobado no se modifica; si se requiere ajustar su redacción, debe tramitarse la autorización correspondiente | Por consultar |

## Pendientes por validar con DPM SAS

- Tarifas, valores en pesos y unidades de cobro de cada servicio.
- Perfil del responsable de campo dentro del sistema.
- Valor y recargos de las jornadas (nocturna, dominical y festiva).
- Qué ocurre cuando las planillas no coinciden y quién decide.
- Pantallas pendientes: registro de clientes, reportes, jornadas, comparación de planillas, gestión de clientes, gestión de cuadrillas y operarios, catálogo de servicios.

## Notas de seguridad y datos

- Todos los datos de prueba son ficticios; las evidencias de la empresa se usan anonimizadas.
- Los documentos originales (cotización y planillas) contienen datos personales y de terceros: no se suben al repositorio.