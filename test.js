const ytdl = require('ytdl-core');
const fs = require('fs');

const videoUrl = 'https://www.youtube.com/watch?v=gmWlNI4Zl2s'; // Reemplaza con un ID de video válido

ytdl(videoUrl, { quality: 'highestaudio' })
  .pipe(fs.createWriteStream('audio.mp3'))
  .on('finish', () => {
    console.log('Audio descargado correctamente');
  })
  .on('error', (err) => {
    console.error('Error al descargar el audio:', err);
  });
