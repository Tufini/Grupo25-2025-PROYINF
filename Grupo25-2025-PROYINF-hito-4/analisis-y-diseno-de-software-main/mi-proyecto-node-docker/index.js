import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use(express.json());


app.use(express.static(path.join(__dirname, "public")));


app.get("/", (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Plataforma Préstamos de Consumo - UsmBank</title>
      <link rel="stylesheet" href="/css/styles.css">
    </head>
    <body class="inicio">
      <div class="inicio-container">
        <h1>Plataforma Préstamos de Consumo</h1>
        <a href="/simulador" class="boton-simulacion">Simulación</a>
      </div>
    </body>
    </html>
  `);
});

// Ruta simulador
app.get("/simulador", (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Simulador de Préstamos - UsmBank</title>
      <link rel="stylesheet" href="/css/styles.css">
    </head>
    <body>
      <div class="container">
        <h2>Simulador de Préstamos</h2>
        <p>Completa los datos para calcular tu préstamo.</p>

        <form id="formSimulador">
          <label for="monto">Monto del préstamo ($):</label>
          <input type="number" id="monto" placeholder="Ej: 100000" required>

          <label for="plazo">Plazo (meses):</label>
          <input type="number" id="plazo" placeholder="Ej: 12" required>

          <label for="tasa">Tasa de interés anual (%):</label>
          <input type="number" id="tasa" placeholder="Ej: 5" required>

          <button type="submit">Simular</button>
        </form>

        <div id="resultado" class="resultado"></div>
        <a href="/" class="boton-simulacion" style="display:block;margin-top:20px;">Volver al inicio</a>
      </div>

      <script src="/js/simulador.js"></script>
    </body>
    </html>
  `);
});

// Levantar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
