# 🎁 Lista de regalos

Web estática con GitHub Pages + Supabase. Sin backend propio.

- `index.html` — página pública: regalos, avisos del organizador y reservas anónimas.
- `admin.html` — panel del organizador con login de Supabase Auth para gestionar regalos, avisos y ver quién ha reservado.
- `supabase/migration.sql` — esquema completo de Supabase.

## Privacidad

- Los invitados no ven quién reservó.
- La reserva se hace mediante la función RPC `gift_reserve`.
- El estado público sale de los contadores `slots_taken` y `slots_total` de `gift_items`.
- Los regalos grupales usan `is_group = true` y `slots_total > 1`.
- El admin se identifica por email en la tabla `gift_admins`.

## URLs

- Lista pública: `https://franklingbp.github.io/Lista/`
- Panel admin: `https://franklingbp.github.io/Lista/admin.html`

## Puesta en marcha

1. Crear el usuario admin en Supabase: Dashboard > Authentication > Users > Add user.
2. Añadir el email en `gift_admins`.
3. Si cambias de proyecto de Supabase, ejecuta `supabase/migration.sql`.
4. GitHub Pages debe apuntar a la rama `gh-pages`.

## Anular una reserva

Desde el panel: pestaña Reservas > Anular. El trigger libera las plazas automáticamente.
