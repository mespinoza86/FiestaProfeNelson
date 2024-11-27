document.getElementById('formAgregar').addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita el comportamiento predeterminado del formulario

    // Obtener los valores del formulario
    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();

    // Validar que los campos no estén vacíos
    if (!nombre || !telefono) {
        alert('Por favor, llena todos los campos antes de enviar.');
        return;
    }

    // Enviar los datos al servidor
    try {
        const response = await fetch('/api/invitados', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, telefono }),
        });

        if (response.ok) {
            const data = await response.json();
            alert(`Invitado agregado satisfactoriamente: ${data.nombre}`);
            document.getElementById('formAgregar').reset(); // Limpia el formulario
        } else {
            alert('Error al agregar el invitado. Por favor, revisa los datos e intenta de nuevo.');
        }
    } catch (error) {
        console.error('Error al intentar conectar con el servidor:', error);
        alert('Ocurrió un error al conectar con el servidor. Revisa la consola para más detalles.');
    }
});
