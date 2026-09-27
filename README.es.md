# Paste Link As

[English](README.md) | [한국어](README.ko.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | **Español** | [Français](README.fr.md)

Pega una URL y elige cómo aparece en tu nota: un enlace con título, una mención en línea o una tarjeta de enlace. Todo se guarda como Markdown normal, así que tus notas se pueden leer sin el plugin.

![Menciones y tarjetas de enlace en una nota](screenshot/sample1.png)

## Cómo funciona

Pega una URL en una nota. Se inserta de inmediato como `[Título](url)` y debajo se abre un pequeño menú:

- **Mantener**: se queda como enlace con título.
- **Mención**: favicon, nombre del sitio y título en una línea.
- **Tarjeta**: miniatura, título, una descripción de dos líneas y el favicon con el dominio.

Usa ↑/↓ y Enter (o Tab) para elegir, y Esc para cerrar. Para ignorar el menú, sigue escribiendo; Enter en **Mantener** crea una nueva línea como siempre.

![Al pegar una URL de YouTube se inserta como enlace con título y luego se convierte en mención y en tarjeta desde el menú](screenshot/sample2.gif)

[Ver la demo en MP4](screenshot/sample2.mp4)

También puedes convertir una URL que ya está en una nota. Selecciónala (una URL sola o un enlace `[Título](url)`) y ejecuta un comando:

- **Convertir enlace en tarjeta**
- **Convertir enlace en mención**

Si no hay nada seleccionado, los comandos usan la URL del portapapeles o te la piden. El plugin no asigna atajos de teclado por defecto; asigna los tuyos en la configuración de Obsidian.

El menú, los comandos y la configuración siguen el idioma de Obsidian: inglés, coreano, chino simplificado, japonés, español o francés. El chino tradicional usa el chino simplificado y cualquier otro idioma usa el inglés.

## Qué se escribe

**Mantener** deja un enlace con título:

```md
[The Odyssey | Official Trailer](https://www.youtube.com/watch?v=Mzw2ttJD2qQ)
```

Una mención es un enlace de Markdown normal. En un video de YouTube, el nombre del sitio es el nombre del canal:

```md
[![|16](favicon-youtube.com.png) *Nombre del canal* The Odyssey | Official Trailer](https://www.youtube.com/watch?v=Mzw2ttJD2qQ)
```

Una tarjeta es un callout `[!link]`:

```md
> [!link] [The Odyssey | Official Trailer](https://www.youtube.com/watch?v=Mzw2ttJD2qQ)
> ![[link-youtube.com-h5vbt4.jpg]]
>
> The Odyssey - In Theaters 07.17.26…
>
> ![[favicon-youtube.com.png|16]] youtube.com
```

No hay sintaxis propia del plugin. Con el plugin desactivado, una mención se ve como un enlace normal y una tarjeta como un callout normal; solo desaparece el estilo.

Al hacer clic en cualquier parte de una tarjeta o una mención se abre el enlace. Para editar una tarjeta en la vista previa en vivo, entra en ella con el cursor desde la línea de abajo.

## Cuándo no se modifica el pegado

El menú no se abre y el pegado funciona como siempre cuando:

- el portapapeles contiene algo que no es una sola URL, o una URL de imagen;
- pegas dentro del destino de un enlace (`](`), justo después de una comilla, `<` o `[`, dentro de código o en las propiedades;
- no tienes conexión.

Pegar una URL sobre texto seleccionado convierte ese texto en enlace: `[texto seleccionado](url)`.

Dentro de listas, citas y tablas, el menú no tiene la opción **Tarjeta**, porque una tarjeta es un callout de varias líneas.

## Configuración

- **Carpeta de imágenes**: dónde se guardan las miniaturas y los favicons. Déjala vacía para usar la ubicación de los archivos adjuntos de la configuración de Obsidian.

## Uso de la red

Cuando pegas una URL o ejecutas un comando, el plugin solicita esa página directamente a su propio sitio para leer el título, la descripción, la imagen y el favicon. Para las tarjetas y las menciones, descarga la imagen y el favicon de ese sitio y los guarda en tu bóveda. No se contacta ningún otro servicio remoto, no se envía nada de tus notas a ningún sitio y no hay telemetría.

## Archivos guardados

- Favicons: `favicon-<dominio>.<ext>`, uno por dominio. Los formatos que Obsidian no puede mostrar, como `.ico`, se convierten a PNG.
- Miniaturas: `link-<dominio>-<hash>.<ext>`.

Los archivos existentes se reutilizan, así que al pegar otro enlace del mismo sitio no se vuelve a descargar su favicon.

## Estilo

`styles.css` solo se aplica a las tarjetas (callouts `[!link]`) y a las menciones (un enlace con una imagen de 16 px y un nombre de sitio en cursiva). Los demás enlaces e imágenes conservan el aspecto de tu tema. Para ajustar el aspecto, sobrescribe estos selectores en un fragmento CSS.

## Limitaciones

- Mientras el menú está abierto, ↑/↓ se mueven dentro del menú. Pulsa Esc primero para mover el cursor.
- Un enlace que contiene una imagen de 16 px de ancho y texto en cursiva se muestra como mención, y un callout de tipo `link` como tarjeta.
- Los plugins que también reescriben las URL pegadas, como Auto Link Title, manejan el mismo evento de pegado. Desactiva su manejo del pegado para que un mismo pegado no se procese dos veces.

## Instalación

- **Plugins de la comunidad**: busca «Paste Link As» en los plugins de la comunidad de Obsidian (una vez publicado).
- **Manual**: descarga `main.js`, `manifest.json` y `styles.css` de la última versión en `<bóveda>/.obsidian/plugins/paste-link-as/`, recarga Obsidian y activa el plugin.

## Licencia

[MIT](LICENSE)
