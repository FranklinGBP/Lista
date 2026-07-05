# Lista para el bebé

Web estática para organizar una lista de cosas a comprar para un bebé.

## Qué incluye

- Diseño responsive para móvil y ordenador.
- Productos agrupados por categoría.
- Filtros por todos, imprescindibles, pendientes y reservados.
- Opción para escribir quién reserva cada producto.
- Guardado local en el navegador mediante `localStorage`.

## Archivos

- `index.html`: estructura principal de la web.
- `styles.css`: estilos visuales.
- `script.js`: productos, filtros y lógica de reservas.

## Cómo publicarla en GitHub Pages

1. Entra en el repositorio en GitHub.
2. Ve a `Settings` > `Pages`.
3. En `Build and deployment`, selecciona:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
4. Guarda los cambios.

Cuando GitHub termine de publicar, la web quedará disponible normalmente en:

`https://FranklinGBP.github.io/Lista/`

## Nota importante

Esta primera versión guarda las reservas solo en el navegador de cada persona. Si varias personas entran desde móviles diferentes, no verán las reservas de los demás.

Para una versión compartida real, el siguiente paso sería conectar una base de datos sencilla como Firebase o Supabase.
