import express from 'express';
import multer from 'multer';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/share', upload.single('file'), (req, res) => {
  console.log('Fichier reçu :', req.file);
  res.send('Fichier bien reçu et stocké 👍');
});

app.listen(3000, () => console.log('Serveur lancé sur http://localhost:3000'));
