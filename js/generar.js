document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('/api/invitados');
    const invitados = await response.json();

    const selectInvitado = document.getElementById('selectInvitado');
    selectInvitado.innerHTML = invitados
        .map(i => `<option value="${i.id}">${i.nombre}</option>`)
        .join('');

    let qrDownloadUrl = ''; // Guardará la URL del archivo generado

    document.getElementById('generarQR').addEventListener('click', async () => {
        const invitadoId = selectInvitado.value;

        // Llama a la API para generar el QR personalizado
        const res = await fetch(`/api/generar-qr/${invitadoId}`, { method: 'POST' });

        if (res.ok) {
            const data = await res.json();

            // Guarda la URL para la descarga
            qrDownloadUrl = data.qrDownloadUrl;

            // Muestra el QR generado
            //document.getElementById('qrText').innerText = `QR personalizado generado`;

            const qrCodeDiv = document.getElementById('qrCode');
            qrCodeDiv.innerHTML = '';

            const img = document.createElement('img');
            img.src = qrDownloadUrl;
            img.alt = 'QR Personalizado del invitado';
            img.width = 400; // Ajusta el tamaño según lo necesario
            qrCodeDiv.appendChild(img);
        } else {
            const errorMsg = await res.text();
            alert(`Error generando QR: ${errorMsg}`);
        }
    });

    document.getElementById('enviarWhatsApp').addEventListener('click', () => {
        if (!qrDownloadUrl) {
            alert('Primero debes generar el QR.');
            return;
        }

        // Descargar el QR automáticamente
        const link = document.createElement('a');
        link.href = qrDownloadUrl;
        link.download = selectInvitado.options[selectInvitado.selectedIndex].text + '.png';
        link.click();

        // Crear el mensaje de WhatsApp
        const mensaje = encodeURIComponent(
            `Hola ${
                selectInvitado.options[selectInvitado.selectedIndex].text
            }, aquí tienes tu código QR personalizado para el evento.`
        );
        const whatsappUrl = `https://wa.me/?text=${mensaje}`;
        window.open(whatsappUrl, '_blank');
    });
});
