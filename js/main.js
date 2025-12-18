document.addEventListener('DOMContentLoaded', () => {
  const bookingDateInput = document.getElementById('booking-date');
  const intervalsContainer = document.getElementById('intervals-container');
  const intervalsWrapper = document.getElementById('schedule-wrapper');
  const toggleIntervalsBtn = document.getElementById('toggle-intervals');
  const contactForm = document.getElementById('contact-form');

  // Array para almacenar los intervalos seleccionados
  let selectedIntervals = [];

  // Función para obtener los intervalos disponibles para una fecha determinada
  async function fetchAvailableSlots(date) {
    try {
      const response = await fetch(`https://backend-placetoplacetransfers.onrender.com/api/availableSlots?date=${date}`);
      if (!response.ok) {
        const { message } = await response.json();
        console.error('Error al obtener intervalos:', message);
        return [];
      }
      const data = await response.json();
      return data.slots;
    } catch (error) {
      console.error('Error en la solicitud de intervalos:', error);
      return [];
    }
  }

  // Función para renderizar los intervalos como botones
  async function renderIntervals() {
    const selectedDate = bookingDateInput.value;
    if (!selectedDate) return;
    
    // Muestra mensaje de carga
    intervalsContainer.innerHTML = '<p>Cargando...</p>';

    const slots = await fetchAvailableSlots(selectedDate);
    
    // Limpiar contenedor después de cargar
    intervalsContainer.innerHTML = '';

    // Reiniciamos los intervalos seleccionados
    selectedIntervals = [];
    updateSelectedDisplay();

    slots.forEach(slot => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = slot.timeSlot;
      btn.classList.add('schedule-btn');

      // Si el intervalo no es seleccionable, lo marcamos visualmente y deshabilitamos el clic
      if (!slot.selectable) {
        btn.disabled = true;
        btn.classList.add(slot.reserved ? 'reserved-slot' : 'non-selectable-slot');
      } else {
        // Toggle de selección
        btn.addEventListener('click', () => {
          if (selectedIntervals.includes(slot.timeSlot)) {
            selectedIntervals = selectedIntervals.filter(s => s !== slot.timeSlot);
            btn.classList.remove('selected');
          } else {
            selectedIntervals.push(slot.timeSlot);
            btn.classList.add('selected');
          }
          updateSelectedDisplay();
        });
      }
      intervalsContainer.appendChild(btn);
    });
  }

  // Función para actualizar el display de intervalos seleccionados
  function updateSelectedDisplay() {
    const list = document.createElement('ul');
    selectedIntervals.forEach(slot => {
      const listItem = document.createElement('li');
      listItem.textContent = slot;
      list.appendChild(listItem);
    });
    // Puedes agregar la lista a algún contenedor si lo requieres, por ejemplo:
    // document.getElementById('selected-intervals').innerHTML = '';
    // document.getElementById('selected-intervals').appendChild(list);
  }

  // Inicializa la fecha actual y renderiza los intervalos
  function initializeDateAndIntervals() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;
    bookingDateInput.value = formattedDate;
    renderIntervals();
  }

  // Evento: actualizar intervalos cuando cambia la fecha
  bookingDateInput.addEventListener('change', renderIntervals);

  // Botón para ocultar/mostrar el contenedor de intervalos
  toggleIntervalsBtn.addEventListener('click', () => {
    if (intervalsWrapper.style.display === 'none') {
      intervalsWrapper.style.display = 'block';
      toggleIntervalsBtn.textContent = 'Hidden schedule';
    } else {
      intervalsWrapper.style.display = 'none';
      toggleIntervalsBtn.textContent = 'Show schedule';
    }
  });

  // Envío del formulario
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = contactForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    const formData = new FormData(contactForm);
    const data = {
      bookingDate: formData.get('booking-date'),
      timeSlots: selectedIntervals, // Enviamos los intervalos seleccionados
      nombre: formData.get('nombre'),
      email: formData.get('email'),
      telefono: formData.get('telefono'),
      mensaje: formData.get('mensaje')
    };

    try {
      const response = await fetch('https://backend-placetoplacetransfers.onrender.com/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (response.ok) {
        alert('Reserva creada exitosamente');
        contactForm.reset();
        submitButton.disabled = false;
        renderIntervals();
      } else {
        alert(result.message || 'Error al crear la reserva');
        submitButton.disabled = false;
      }
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      alert('Error en la solicitud.');
      submitButton.disabled = false;
    }
  });

  initializeDateAndIntervals();
});
