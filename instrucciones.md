Actúa como un desarrollador Full-Stack experto en Python y arquitectura web. Tu tarea es escribir el código completo y funcional para una "Balotera Virtual de Bingo" basada en web.

El sistema debe permitir jugar múltiples partidas, animar la extracción de balotas, actualizar un tablero general en tiempo real y validar ganadores basados en un set predefinido de 30 cartones de un juego llamado "alma cafe BINGO".

Stack Tecnológico requerido:

Backend: Python, Flask.

Base de Datos: SQLAlchemy (SQLite).

Frontend: HTML5, CSS3, Vanilla JavaScript (sin frameworks).

Requerimientos del Backend (Modelos y Lógica):

Gestión de Partidas: Crea un modelo Partida para registrar múltiples juegos (solo una partida activa a la vez).

Gestión de Balotas: Crea un modelo Balota (letra B-I-N-G-O y número del 1 al 75) asociado a una partida. El endpoint de extracción debe garantizar que no se repitan números en la partida activa.

Gestión de Cartones: Crea un modelo Carton que almacene el ID del cartón (ej. "001" al "030") y un array/JSON con sus 24 números correspondientes.

Validación de Ganadores: Un endpoint que reciba el ID de un cartón, lo compare con las balotas extraídas de la partida activa y devuelva si es ganador o qué números le faltan.

Requerimientos del Frontend (Interfaz y Animaciones):

La Balotera (Animación): Un contenedor visual circular en el centro de la pantalla. Al hacer clic en "Sacar Balota", debe ejecutarse una animación CSS fluida (ej. rotación rápida simulando un sorteo) durante unos 3 a 5 segundos.

La Pelotica: Una vez finalizada la animación de la balotera, debe aparecer una "pelotica" virtual (animación de escala/pop) mostrando claramente la letra y el número ganador (ej. "G-54").

Tablero General: Una cuadrícula visible con los 75 números. Cada vez que el backend devuelva una balota y termine la animación, el número correspondiente en esta cuadrícula debe marcarse visualmente (ej. cambio de color y tachado).

Flujo asíncrono: Toda la comunicación entre el frontend y el backend para sacar balotas y verificar ganadores debe hacerse mediante fetch (AJAX), sin recargar la página.