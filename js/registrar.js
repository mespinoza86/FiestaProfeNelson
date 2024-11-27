const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Función para obtener la cámara trasera
async function getBackCamera() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const backCamera = devices.find(device => device.kind === 'videoinput' && device.label.toLowerCase().includes('back'));
    
    if (backCamera) {
        return backCamera.deviceId;
    }
    return null;
}

async function startScanner() {
    // Obtén el ID de la cámara trasera
    const backCameraId = await getBackCamera();
/*
    if (!backCameraId) {
        alert("No se pudo encontrar la cámara trasera.");
        return;
    }*/

    // Usamos la cámara trasera con getUserMedia
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: backCameraId } // Especifica que queremos la cámara trasera
    });

    video.srcObject = stream;

    // Cada medio segundo se dibuja la imagen del video en el canvas
    setInterval(() => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

        // Si se detecta un QR, lo procesamos
        if (qrCode) {
            console.log("QR Detectado:", qrCode.data); // Muestra el QR en la consola

            // Llamada a la API para registrar el invitado
            fetch(`/api/registrar/${qrCode.data}`, { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    alert(data.message); // Muestra el mensaje de registro
                    // Detenemos el flujo de la cámara después de registrar correctamente
                    video.srcObject.getTracks().forEach(track => track.stop());
                })
                .catch(err => {
                    console.error("Error registrando:", err);
                    alert('Error al registrar el invitado.');
                });
        }
    }, 500); // Intervalo de 500ms para dibujar y detectar QR
}

// Inicia el escaneo
startScanner();
