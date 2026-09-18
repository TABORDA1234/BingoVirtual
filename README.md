# Balotera Virtual de Bingo - Alma Café

Aplicación web full-stack interactiva de Bingo, diseñada con estética "Alma Café". Incluye una balotera con física 3D en la pantalla principal y pantallas individuales conectadas en tiempo real para que los jugadores sigan el juego desde sus teléfonos móviles.

## Características
- **Pantalla Principal (Administrador)**: Muestra la balotera animada en 3D (con cuenta regresiva física de 75 a 0 balotas) y el tablero general agrupado por B-I-N-G-O.
- **Cartones Virtuales Reales**: 30 cartones físicos mapeados exactamente al sistema. Los jugadores acceden con su ID (001 a 030).
- **Multijugador y Sincronización**: Los jugadores marcan manualmente su cartón como si usaran frijolitos, mientras el sistema les indica el estado en vivo de la partida.

## Instalación y Ejecución Local

1. Crea un entorno virtual:
   ```bash
   python -m venv venv
   ```
2. Activa el entorno virtual:
   - Windows: `.\venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
3. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Genera la base de datos y carga los 30 cartones:
   ```bash
   python seed.py
   ```
5. Inicia el servidor local:
   ```bash
   python app.py
   ```

Ve a `http://127.0.0.1:5000` para iniciar sesión y `http://127.0.0.1:5000/screen` para la balotera 3D.

## Despliegue en Render.com

El proyecto ya está completamente configurado para desplegarse fácilmente en **Render**.

### Opción 1: Blueprint (Recomendado)
1. Conecta tu cuenta de Github o Gitlab a Render.
2. Ve a la sección **Blueprints** en Render y selecciona tu repositorio.
3. Render detectará automáticamente el archivo `render.yaml` y configurará los comandos de construcción (`buildCommand`) y de inicio (`startCommand`) por ti, así como las variables de entorno.

### Opción 2: Web Service Manual
Si prefieres crearlo manualmente como un *Web Service*:
- **Environment**: `Python`
- **Build Command**: `pip install -r requirements.txt && python seed.py`
- **Start Command**: `gunicorn app:app`
- **Variables de Entorno (Environment Variables)**:
  - `PYTHON_VERSION`: `3.11.0` (Opcional, pero recomendado para estabilidad)
  - `FLASK_ENV`: `production`

> **Nota sobre Base de Datos**: Actualmente usa SQLite (`bingo.db`). En plataformas de despliegue como Render (que tienen sistemas de archivos efímeros), el disco se borra cada vez que la app se suspende o reinicia. Gracias al `buildCommand` de Render, los 30 cartones se volverán a crear automáticamente al reiniciar. Si necesitas persistir el historial de partidas, se recomienda añadir un *Disk* en la configuración avanzada de Render.
