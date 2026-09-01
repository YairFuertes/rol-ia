# rol-ia

Partidas de rol dirigidas por Claude.

## Que hay aca

- **`CLAUDE.md`** — el reglamento del Director. Como dirijo, no que dirijo.
  Se aplica a todas las campanas y no se toca salvo que lo pida el jugador.
- **`campanas/<nombre>/`** — una carpeta por campana:
  - `canon.md` — modo de voz, mundo, geografia, facciones, hechos permanentes
  - `personaje.md` — aptitudes, estado, inventario, heridas
  - `npcs.md` — quien es quien, que quiere, que recuerda del jugador
  - `bitacora.md` — lo ocurrido por sesiones + hilos abiertos

## Como se juega

**Empezar una campana nueva:** pedir mundos, o decir una tematica.

**Retomar una campana:** escribir `Retomamos [nombre de la campana]`.
El Director lee la carpeta entera antes de decir nada y arranca con un
*previamente...*. Si la memoria y el archivo se contradicen, gana el archivo.

**Comandos meta:** van con `!` y estan listados en `CLAUDE.md`, seccion 11.
Los mas usados: `!estado`, `!ficha`, `!dados`, `!hilos`, `!voz`, `!guardar`.

## Desde el celular

Este repositorio existe para poder jugar sin depender de una computadora
encendida. Entrar a claude.ai/code desde el navegador del celular, elegir
este repositorio, y escribir `Retomamos [campana]`.

Cada campana tiene ademas una pagina web privada con enlace fijo (Artifact)
que funciona como tablero de consulta: ficha, estado, inventario, NPC, hilos,
bitacora y mapas.
