const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode'); // Importamos la librería QRCode

const app = express();
const PORT = 3000;

const sharp = require('sharp'); // Para manipulación de imágenes
const templatePath = path.join(__dirname, 'qrs', 'FiestaTemplate.jpeg'); // Ruta de la plantilla
const { createCanvas, loadImage } = require('canvas'); // Asegúrate de tener instalada la librería canvas



// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));


// Carpeta para almacenar los QR generados
const qrFolderPath = path.join(__dirname, 'qrs');
if (!fs.existsSync(qrFolderPath)) {
    fs.mkdirSync(qrFolderPath);
}


// Ruta del archivo invitados.json
const invitadosFilePath = path.join(__dirname, 'invitados.json');

// Leer datos de invitados
function readInvitados() {
    if (!fs.existsSync(invitadosFilePath)) {
        fs.writeFileSync(invitadosFilePath, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(invitadosFilePath, 'utf8'));
}

// Guardar datos de invitados
function saveInvitados(data) {
    fs.writeFileSync(invitadosFilePath, JSON.stringify(data, null, 2));
}


// API para generar un QR único para un invitado y guardarlo como imagen
// API para generar un QR y combinarlo con la plantilla
app.post('/api/generar-qr/:id', async (req, res) => {
    const invitados = readInvitados();
    const invitado = invitados.find(i => i.id === req.params.id);

    if (!invitado) {
        return res.status(404).send('Invitado no encontrado.');
    }

    try {
        const qrCodePath = path.join(__dirname, 'qrs', `${invitado.nombre.replace(/\s+/g, '')}.png`);
        const templatePath = path.join(__dirname, 'qrs', 'FiestaTemplate.jpeg');

        // Si no existe un QR previo, generarlo
        if (!invitado.qr) {
            invitado.qr = uuidv4();
            saveInvitados(invitados);

            // Generar QR en base64
            await QRCode.toFile(qrCodePath, invitado.qr, {
                width: 300, // Tamaño del QR
            });
        }

        // Cargar la plantilla
        const templateImage = await loadImage(templatePath);
        const qrImage = await loadImage(qrCodePath);

        // Crear canvas para la nueva imagen
        const canvasWidth = templateImage.width;
        const canvasHeight = templateImage.height + 100; // Añadimos un poco de espacio para el QR
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        // Dibujar la plantilla en el canvas
        ctx.drawImage(templateImage, 0, 0);

        // Estilo del texto del nombre
        const fontSize = 80;
        ctx.font = `bold ${fontSize}px "Comic Sans MS"`;
        ctx.fillStyle = 'white'; // Color blanco
        ctx.textAlign = 'center';
        ctx.fillText(
            invitado.nombre,
            canvasWidth / 2, // Centramos en la mitad del canvas
            fontSize + 40 // Aseguramos un margen en la parte superior
        );

        // Dibujar el QR más abajo
        const qrX = (canvasWidth - 300) / 2; // Centramos el QR
        const qrY = canvasHeight - 450; // Lo colocamos más abajo
        ctx.drawImage(qrImage, qrX, qrY, 300, 300);

        // Guardar el archivo combinado
        const outputFilePath = path.join(__dirname, 'qrs', `${invitado.nombre.replace(/\s+/g, '')}_combined.png`);
        const out = fs.createWriteStream(outputFilePath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);

        out.on('finish', () => {
            res.json({
                message: 'QR personalizado generado con éxito.',
                qrDownloadUrl: `/qrs/${path.basename(outputFilePath)}`,
                qrFileName: `${invitado.nombre.replace(/\s+/g, '')}_combined.png`,
            });
        });
    } catch (error) {
        console.error('Error al generar QR personalizado:', error);
        res.status(500).send('Error al generar el QR personalizado.');
    }
});

// Servir archivos de la carpeta "qrs"
app.use('/qrs', express.static(qrFolderPath));

// API para obtener todos los invitados
app.get('/api/invitados', (req, res) => {
    try {
        const invitados = readInvitados();
        res.json(invitados);
    } catch (error) {
        console.error('Error leyendo invitados:', error);
        res.status(500).send('Error al leer los datos de invitados.');
    }
});

// API para agregar un nuevo invitado
app.post('/api/invitados', (req, res) => {
    try {
        const { nombre, telefono } = req.body;
        if (!nombre || !telefono) {
            return res.status(400).json({ error: 'Nombre y teléfono son obligatorios.' });
        }

        const invitados = readInvitados();
        const nuevoInvitado = { id: uuidv4(), nombre, telefono, qr: '', presente: false };
        invitados.push(nuevoInvitado);
        saveInvitados(invitados);

        res.json(nuevoInvitado);
    } catch (error) {
        console.error('Error al agregar invitado:', error);
        res.status(500).send('Error al agregar el invitado.');
    }
});

/*
// API para generar un QR único para un invitado
app.post('/api/generar-qr/:id', (req, res) => {
    const invitados = readInvitados();
    const invitado = invitados.find(i => i.id === req.params.id);

    if (!invitado) {
        return res.status(404).send('Invitado no encontrado.');
    }

    if (!invitado.qr) {
        invitado.qr = uuidv4(); // Generar QR único
        saveInvitados(invitados);
    }

    // Generar la imagen QR
    QRCode.toDataURL(invitado.qr, function (err, url) {
        if (err) {
            return res.status(500).send('Error generando el QR.');
        }
        // Devolver el QR como URL de la imagen
        res.json({ qr: url });
    });
});
*/

// API para registrar la entrada de un invitado mediante su QR
app.post('/api/registrar/:qr', (req, res) => {
    try {
        const invitados = readInvitados();
        const invitado = invitados.find(i => i.qr === req.params.qr);

        if (!invitado) {
            return res.status(404).send('QR inválido.');
        }

        if (invitado.presente) {
            return res.status(400).send('Invitado ya registrado.');
        }

        invitado.presente = true;
        saveInvitados(invitados);

        res.json({ message: 'Invitado registrado exitosamente.', invitado });
    } catch (error) {
        console.error('Error al registrar invitado:', error);
        res.status(500).send('Error al registrar el invitado.');
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
