# Lista para el bebé

Web estática para organizar una lista de cosas a comprar para un bebé y compartirla con familia y amigos.

## Qué incluye

- Diseño responsive para móvil y ordenador.
- Productos agrupados por categoría.
- Filtros por todos, imprescindibles, pendientes y reservados.
- Opción para escribir quién reserva cada producto.
- Modo local para pruebas.
- Modo compartido con Supabase para que todos vean las mismas reservas.

## Archivos

- `index.html`: estructura principal de la web.
- `styles.css`: estilos visuales.
- `script.js`: productos, filtros y lógica de reservas.
- `config.js`: configuración de Supabase.
- `supabase.sql`: script para crear la tabla de reservas compartidas.

## Publicar en GitHub Pages

La URL correcta del proyecto será:

`https://FranklinGBP.github.io/Lista/`

Si entras solo en `https://FranklinGBP.github.io/`, puede salir 404 porque esa es la web raíz de la cuenta, no la del repositorio `Lista`.

Pasos:

1. Entra en el repositorio en GitHub.
2. Ve a `Settings` > `Pages`.
3. En `Build and deployment`, selecciona:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
4. Guarda los cambios.
5. Espera 1 o 2 minutos y abre `https://FranklinGBP.github.io/Lista/`.

Importante: si GitHub Pages no te deja publicarlo desde un repositorio privado, cambia el repositorio a público o usa un despliegue tipo Netlify/Vercel.

## Activar reservas compartidas con Supabase

La web ya está preparada, pero falta configurar Supabase.

### 1. Crear proyecto

1. Entra en Supabase.
2. Crea un proyecto nuevo.
3. Cuando esté creado, ve a `Project Settings` > `API`.
4. Copia:
   - `Project URL`
   - `anon public key`

### 2. Crear tabla

1. En Supabase, ve a `SQL Editor`.
2. Copia y ejecuta el contenido del archivo `supabase.sql`.

### 3. Configurar la web

Edita `config.js` y rellena:

```js
window.APP_CONFIG = {
  supabaseUrl: "https://TU-PROYECTO.supabase.co",
  supabaseAnonKey: "TU-ANON-PUBLIC-KEY",
  listId: "familia-bebe-2026"
};
```

Cuando esté configurado, cualquier persona con el enlace podrá reservar o liberar productos y los demás lo verán también.

## Nota de seguridad

Esta lista está pensada para compartir por enlace con familia y amigos. No tiene login. Cualquiera que tenga el enlace podrá modificar reservas.
