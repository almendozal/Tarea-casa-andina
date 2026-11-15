const totalSteps = 10;
let currentStep = 1;
let adults = 2;
let children = 0;
let selectedDestination = "Cusco";
let selectedRoomTab = "Matrimonial";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const overlay = $("#loading-overlay");
const toast = $("#toast");

const names = ["Bienvenida","Destino","Fechas y huéspedes","Motivo del viaje","Presupuesto y habitación","Actividades","Recomendación","Detalle y comparación","Servicios extra","Resumen y confirmación"];

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function renderStep(step) {
  $$(".step").forEach(section => section.classList.toggle("active", section.id === `step-${step}` || (step === "success" && section.id === "step-success")));
  if (step !== "success") {
    currentStep = step;
    $("#step-name").textContent = names[step - 1];
    $("#step-number").textContent = `Paso ${step} de ${totalSteps}`;
    $("#progress-fill").style.width = `${step / totalSteps * 100}%`;
  }
  const isFirst = step === 1 || step === "success";
  $("#header-back").hidden = isFirst;
  $("#footer-back").hidden = isFirst;
  $("#chat-input").placeholder = step === "success" ? "¡Gracias por elegir Casa Andina!" : "Escriba un mensaje";
  $("#step-1").parentElement.scrollTop = 0;
}

function goTo(step, message = "Preparando el siguiente paso...") {
  if (step < 1 || step > totalSteps) return;
  $("#loading-message").textContent = message;
  overlay.classList.add("visible");
  overlay.setAttribute("aria-hidden","false");
  setTimeout(() => {
    renderStep(step);
    overlay.classList.remove("visible");
    overlay.setAttribute("aria-hidden","true");
  }, 650);
}

function updateCounters() {
  $("#adults-value").textContent = adults;
  $("#children-value").textContent = children;
}

function selectedValue(name, fallback) {
  return $(`input[name="${name}"]:checked`)?.value || fallback;
}

function updateBudget() {
  const max = Number($("#budget-range").value);
  const min = Math.max(100, max - 150);
  $("#budget-value").textContent = `S/${min} – S/${max}`;
}

function updateExtras() {
  const total = $$("[data-extra]:checked").reduce((sum, input) => sum + Number(input.dataset.price), 0);
  $("#extras-total").textContent = `S/${total}`;
  return total;
}

function nightsCount() {
  const start = $("#arrival-date").value;
  const end = $("#departure-date").value;
  if (!start || !end) return 3;
  const nights = Math.round((new Date(end) - new Date(start)) / 86400000);
  return nights > 0 ? nights : 3;
}

function updateSummary() {
  const room = selectedValue("room-type", "Matrimonial");
  const extras = updateExtras();
  const nights = nightsCount();
  const arrival = $("#arrival-date").value;
  const departure = $("#departure-date").value;
  const dateText = arrival && departure ? `${arrival} – ${departure}` : `${nights} noches`;
  $("#summary-room").textContent = room;
  $("#summary-dates").textContent = dateText;
  $("#summary-guests").textContent = `${adults} adultos${children ? `, ${children} niños` : ""}`;
  $("#summary-extras").textContent = `S/${extras}`;
  const roomPrice = selectedRoomTab === "Doble" ? 300 : 280;
  $("#grand-total").textContent = `S/${roomPrice * nights + extras}`;
}

$("#start-button").addEventListener("click", () => goTo(2, "Buscando destinos para ti..."));
$("#human-button").addEventListener("click", () => notify("Pronto podrás contactar con un asesor."));
$("#header-back").addEventListener("click", () => goTo(currentStep - 1));
$("#footer-back").addEventListener("click", () => goTo(currentStep - 1));

$$("[data-destination]").forEach(button => button.addEventListener("click", () => {
  $$(".destination-card").forEach(card => card.classList.remove("selected"));
  button.classList.add("selected");
  selectedDestination = button.dataset.destination;
  $("#destination-input").value = "";
  notify(`Destino seleccionado: ${selectedDestination}`);
}));

$("#other-destination").addEventListener("click", () => {
  $("#destination-input").focus();
  notify("Escribe el destino que deseas visitar.");
});
$("#destination-next").addEventListener("click", () => {
  const typed = $("#destination-input").value.trim();
  if (typed) selectedDestination = typed;
  if (!selectedDestination) return notify("Selecciona o escribe un destino.");
  goTo(3, `Preparando tu viaje a ${selectedDestination}...`);
});

$$("[data-counter]").forEach(button => button.addEventListener("click", () => {
  const key = button.dataset.counter;
  const delta = Number(button.dataset.change);
  if (key === "adults") adults = Math.max(1, Math.min(10, adults + delta));
  if (key === "children") children = Math.max(0, Math.min(10, children + delta));
  updateCounters();
}));

$$(".next-step").forEach(button => button.addEventListener("click", () => {
  if (currentStep === 3) {
    const start = $("#arrival-date").value, end = $("#departure-date").value;
    if (start && end && new Date(end) <= new Date(start)) return notify("La salida debe ser posterior a la llegada.");
  }
  if (currentStep === 5) {
    const budget = $("#budget-value").textContent;
    $("#selected-summary").textContent = `${budget} · ${selectedValue("room-type","Matrimonial")}`;
  }
  if (currentStep === 7) updateSummary();
  if (currentStep === 8) updateSummary();
  if (currentStep === 9) updateSummary();
  goTo(currentStep + 1);
}));

$("#skip-activities").addEventListener("click", () => goTo(7, "Buscando hoteles disponibles..."));
$("#show-hotels").addEventListener("click", () => goTo(7, "Buscando hoteles según tus preferencias..."));
$("#more-hotels").addEventListener("click", () => notify("Mostraremos más hoteles cuando conectemos el catálogo."));
$$("[data-room-tab]").forEach(button => button.addEventListener("click", () => {
  $$("[data-room-tab]").forEach(tab => tab.classList.toggle("active", tab === button));
  selectedRoomTab = button.dataset.roomTab;
  $("#room-price").textContent = selectedRoomTab === "Doble" ? "S/300 por noche" : "S/280 por noche";
  updateSummary();
}));
$$("[data-extra]").forEach(input => input.addEventListener("change", updateExtras));

$("#booking-form").addEventListener("submit", event => {
  event.preventDefault();
  updateSummary();
  goTo("success");
  setTimeout(() => {
    // El cambio a confirmación ocurre tras la misma pantalla de carga.
  }, 0);
});

$("#modify-booking").addEventListener("click", () => goTo(1, "Volviendo al inicio..."));
$("#restart-button").addEventListener("click", () => {
  $("#booking-form").reset();
  adults = 2; children = 0; selectedDestination = "Cusco";
  updateCounters();
  goTo(1, "Iniciando una nueva búsqueda...");
});

$("#chat-send").addEventListener("click", sendChat);
$("#chat-input").addEventListener("keydown", event => { if (event.key === "Enter") sendChat(); });
function sendChat() {
  const input = $("#chat-input");
  const message = input.value.trim();
  if (!message) return;
  notify("Gracias. En una siguiente versión el asistente IA responderá tus mensajes.");
  input.value = "";
}

$("#budget-range").addEventListener("input", updateBudget);
$("#arrival-date").addEventListener("change", () => {
  const arrival = $("#arrival-date").value;
  if (arrival) {
    const minDate = new Date(arrival);
    minDate.setDate(minDate.getDate() + 1);
    $("#departure-date").min = minDate.toISOString().slice(0,10);
  }
});
$("#booking-form").addEventListener("submit", () => {
  // La demostración no procesa pagos ni crea una reserva real.
});

updateCounters();
updateBudget();
updateExtras();
renderStep(1);
