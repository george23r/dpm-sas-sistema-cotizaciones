-- Credenciales ficticias Ãºnicamente para E2E local/CI.
-- No usar este archivo para producciÃ³n ni como polÃ­tica de contraseÃ±as.
SET search_path = dpm, public;

UPDATE usuarios
SET password_hash = CASE correo
  WHEN 'admin@dpm.example' THEN '$2b$12$vKf2e94T/4WPQmNEg/F5D.ba3nXoV7HBE24i6xvXMRxaXLGyVKhaK'
  WHEN 'hacienda@cliente.example' THEN '$2b$12$u47fT/mK5RM./MXcFQMwJORg9vaLeBbWr5nyfog37J.V4KaaEnqCa'
  WHEN 'luis.gomez@dpm.example' THEN '$2b$12$fc1sttlAQFn.wf/lwCsbQuaPOAwZeP/8lNEifGH4gnoMVw.5tszBW'
  ELSE password_hash
END
WHERE correo IN ('admin@dpm.example', 'hacienda@cliente.example', 'luis.gomez@dpm.example');

