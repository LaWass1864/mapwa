import express from 'express';
import multer from 'multer';
import cors from 'cors';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());

app.post('/share', upload.single('file'), (req, res) => {
  console.log('Fichier reçu :', req.file);
  res.send('Fichier reçu et stocké 👍');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
