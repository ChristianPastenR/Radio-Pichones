const app = require('./app');

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Servidor de transmisión de audio escuchando en http://localhost:${port}`);
});
