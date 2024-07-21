const ytdl = require('@distube/ytdl-core');
const ytpl = require('@distube/ytpl');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const urlParser = require('url');

ffmpeg.setFfmpegPath(ffmpegStatic);

const logFilePath = path.join(__dirname, '..', 'logs', 'playback.log');
const audioDir = path.join(__dirname, '..', 'audios');
let currentTitle = '';

if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
  fs.mkdirSync(path.join(__dirname, '..', 'logs'));
}

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir);
}

const logPlayback = (videoTitle) => {
  const logEntry = `${new Date().toISOString()} - ${videoTitle}\n`;
  fs.appendFileSync(logFilePath, logEntry);

  const logData = fs.readFileSync(logFilePath, 'utf8').split('\n');
  if (logData.length > 10000) {
    const newLogData = logData.slice(logData.length - 10000);
    fs.writeFileSync(logFilePath, newLogData.join('\n'));
  }
};

const downloadAndStreamAudio = async (videoUrl, res, videoTitle) => {
  console.log(`Downloading and streaming audio: ${videoTitle}`);
  const audioFilePath = path.join(audioDir, `${videoTitle}.mp3`);
  console.log(videoUrl)

  try {
    const stream = ytdl(videoUrl, {
      quality: 'highestaudio',
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      },
      highWaterMark: 1 << 30,
      liveBuffer: 1 << 30,
    });
    console.log
    ffmpeg(stream)
      .audioBitrate(96)
      .audioChannels(1)
      .format('mp3')
      .save(audioFilePath)
      .on('error', error => {
        console.error('Error al convertir el audio:', error);
        if (!res.headersSent) {
          res.status(500).send('Error al convertir el audio');
        }
      })
      .on('end', () => {
        console.log(`Audio downloaded and saved: ${audioFilePath}`);
        logPlayback(videoTitle);

        // Transmitir el audio descargado
        const audioStream = fs.createReadStream(audioFilePath);
        audioStream.pipe(res);
        audioStream.on('end', () => {
          // Eliminar el archivo de audio después de la transmisión
          fs.unlink(audioFilePath, (err) => {
            if (err) {
              console.error('Error al eliminar el archivo de audio:', err);
            } else {
              console.log(`Archivo de audio eliminado: ${audioFilePath}`);
            }
          });
        });
      });

    currentTitle = videoTitle;
  } catch (error) {
    console.error('Error al descargar el audio:', error);
    if (!res.headersSent) {
      res.status(500).send('Error al descargar el audio');
    }
  }
};

exports.streamAudio = async (req, res) => {
  res.setHeader('Content-Type', 'audio/mpeg');
  const { url } = req.query;
  if (!url) {
    return res.status(400).send('URL de YouTube es requerida');
  }

  try {
    const videoInfo = await ytdl.getInfo(url, {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      }
    });
    const videoTitle = videoInfo.videoDetails.title;
    await downloadAndStreamAudio(url, res, videoTitle);
  } catch (error) {
    console.error('Error al obtener el video:', error);
    res.status(500).send('Error al obtener el video');
  }
};

exports.getLog = (req, res) => {
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el log:', err);
      return res.status(500).send('Error al leer el log');
    }
    res.send(data);
  });
};

exports.uploadPlaylist = async (req, res) => {
  const { url } = req.body;

  if (!url) {
    console.error('No URL provided');
    return res.status(400).send('No URL provided');
  }

  // Extraer el ID de la lista de reproducción desde la URL
  const parsedUrl = urlParser.parse(url, true);
  const playlistID = parsedUrl.query.list;

  if (!playlistID) {
    console.error('No playlist ID found in URL');
    return res.status(400).send('Invalid playlist URL');
  }

  const isValidPlaylist = await ytpl.validateID(playlistID);
  if (!isValidPlaylist) {
    console.error('Invalid playlist ID');
    return res.status(400).send('Invalid playlist URL');
  }

  try {
    const playlist = await ytpl(playlistID);
    if (playlist.items.length === 0) {
      console.error('Empty playlist');
      return res.status(400).send('Empty playlist');
    }

    const firstVideo = playlist.items[0];
    console.log(`Uploading playlist, first video: ${firstVideo.title}`);
    await downloadAndStreamAudio(firstVideo.shortUrl, res, firstVideo.title);
  } catch (error) {
    console.error('Error al obtener la lista de reproducción:', error);
    res.status(500).send('Error al obtener la lista de reproducción');
  }
};

exports.getCurrentTitle = (req, res) => {
  res.json({ title: currentTitle });
};
