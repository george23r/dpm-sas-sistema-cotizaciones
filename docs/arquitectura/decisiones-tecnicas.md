# Registro de decisiones tÃ©cnicas â€” DPM S.A.S.

Estado actualizado: 2026-11-08. Este registro distingue decisiones implementadas y probadas de supuestos que aÃºn requieren validaciÃ³n empresarial.

| ID | DecisiÃ³n | Alternativas y justificaciÃ³n | Estado |
|---|---|---|---|
| D-01 | AplicaciÃ³n web de una sola pÃ¡gina con React y TypeScript | Un solo cÃ³digo sirve a escritorio y celular (RNF-01); TypeScript reduce errores en formularios con varios roles. | Implementada y probada |
| D-02 | API REST con Node.js y Express | El mismo lenguaje en cliente y servidor desacopla la interfaz de los datos. | Implementada bajo `/api/v1` y probada |
| D-03 | Base de datos relacional PostgreSQL | Relaciones fuertes y reglas de integridad para cliente, zona, cotizaciÃ³n, orden, cuadrilla y planillas. | Construida y probada con PostgreSQL 16 local |
| D-04 | La cotizaciÃ³n se arma por lÃ­neas (concepto, cantidad, valor unitario), no con una fÃ³rmula por metros cuadrados | La entrevista respalda el cÃ¡lculo individual por servicio; no se impone una tarifa automÃ¡tica por Ã¡rea. | Implementada y probada |
| D-05 | Una cotizaciÃ³n enviada no se modifica y tiene vigencia documentada de 15 dÃ­as | El valor de vigencia procede del ejemplo acadÃ©mico y queda sujeto a confirmaciÃ³n de DPM. | Implementada; regla empresarial pendiente de validar |
| D-06 | El cruce de horarios de una cuadrilla se bloquea en la base de datos y dentro de una transacciÃ³n | Evita depender Ãºnicamente de validaciones del navegador y protege operaciones concurrentes. | Implementada y probada |
| D-07 | El control de turnos es un mÃ³dulo de registro, comparaciÃ³n y conciliaciÃ³n; la factura queda fuera del alcance | La comparaciÃ³n previa al cobro estÃ¡ dentro del alcance; no se implementa facturaciÃ³n electrÃ³nica ni nÃ³mina. | Implementada y probada |
| D-08 | El cliente consulta el estado de sus solicitudes en su portal; no hay notificaciones automÃ¡ticas | Evita agregar correo, WhatsApp o SMS fuera del alcance. | Implementada; alcance de notificaciones pendiente de validar |
| D-09 | El estado â€œIncidenciaâ€ no se modela; las novedades se registran en la nota de finalizaciÃ³n | No se agrega un estado que no exista en el modelo verificado. | Implementada |
| D-10 | AutenticaciÃ³n por sesiÃ³n con cookie HttpOnly, permisos por rol y contraseÃ±as con hash | Se evita guardar JWT o credenciales en `localStorage`; la API aplica autenticaciÃ³n, propiedad y membresÃ­a de cuadrilla. | Implementada y probada |
| D-11 | Despliegue en Vercel, Render y PostgreSQL gestionado como opciÃ³n | Son alternativas de despliegue, no un despliegue ya realizado ni una promesa de disponibilidad. | Pendiente de despliegue y validaciÃ³n de infraestructura |
| D-12 | Las variables del objetivo especÃ­fico 1 se interpretan segÃºn la entrevista | Incluyen unidades, personal, maquinaria, dÃ­as, herramientas, combustible y transporte; no se modifica el objetivo acadÃ©mico sin autorizaciÃ³n. | Documentada; validaciÃ³n acadÃ©mica/empresarial pendiente |

## Pendientes por validar con DPM S.A.S.

- Tarifas, valores en pesos y unidades definitivas de cada servicio.
- Perfil y permisos exactos del responsable de campo.
- Valor y recargos de las jornadas nocturnas, dominicales y festivas.
- QuÃ© ocurre cuando las planillas no coinciden y quiÃ©n decide la conciliaciÃ³n.
- Si el registro/autogestiÃ³n de clientes debe habilitarse.
- PolÃ­tica definitiva de vigencia de cotizaciones.

## Notas de seguridad y datos

- Todos los datos usados en desarrollo y pruebas son ficticios; no representan tarifas ni personal real de DPM.
- Las evidencias de integraciÃ³n se ejecutaron contra una base PostgreSQL local de pruebas.
- Los documentos originales con datos personales o de terceros no se suben al repositorio.
- La revisiÃ³n legal y de cumplimiento de la Ley 1581 de 2012 queda fuera de esta implementaciÃ³n tÃ©cnica.

