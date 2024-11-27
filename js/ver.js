document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('/api/invitados');
    const invitados = await response.json();

    const listaInvitados = document.getElementById('listaInvitados');
    listaInvitados.innerHTML = invitados.map(invitado => `
        <tr>
            <td>${invitado.nombre}</td>
            <td>${invitado.telefono}</td>
            <td>${invitado.qr ? 'Sí' : 'No'}</td>
            <td>${invitado.presente ? 'Sí' : 'No'}</td>
        </tr>
    `).join('');
});
