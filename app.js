const CAPACITY = 12;
const COMPANY = {
  name: "Mata Reva Teahupo'o",
  phone: "68989714939",
  displayPhone: "89 71 49 39",
  website: "https://www.facebook.com/matarevateahupoo",
  departure: "Marina de Teahupo'o",
  boat: "Arc Cruiser 28 pieds"
};

const STATUSES = {
  option: "Option",
  confirmed: "Confirmée",
  done: "Réalisée",
  cancelled: "Annulée",
  callback: "À rappeler"
};

const STATUS_CLASSES = {
  option: "option",
  confirmed: "confirmed",
  done: "done",
  cancelled: "cancelled",
  callback: "callback"
};

const MESSAGE_TYPES = [
  ["confirmation", "Confirmation réservation"],
  ["reminder", "Rappel veille"],
  ["weather", "Météo / report"],
  ["cancellation", "Annulation"],
  ["waiver", "Décharge surfeur"]
];

const SERVICE_DEFS = [
  {
    id: "tepari",
    name: "Dépose randonneurs - Te Pari",
    short: "Te Pari",
    category: "Dépose",
    kind: "tepari",
    prices: { aller: 1500, retour: 1500 },
    duration: "Selon trajet",
    note: "Prix par personne et par trajet."
  },
  {
    id: "surfer",
    name: "Dépose surfeur",
    short: "Surfeur",
    category: "Dépose",
    kind: "perPerson",
    prices: { person: 4000 },
    duration: "1h30",
    requiresWaiver: true,
    note: "Décharge signée à contrôler avant départ."
  },
  {
    id: "wave",
    name: "Sortie vague",
    short: "Vague",
    category: "Sortie",
    kind: "adultChild",
    prices: { adult: 4000, child: 3000 },
    duration: "1h30",
    note: "Enfant : moins de 12 ans."
  },
  {
    id: "wave-lagoon",
    name: "Sortie vague et lagon",
    short: "Vague + lagon",
    category: "Sortie",
    kind: "adultChild",
    prices: { adult: 5000, child: 4000 },
    duration: "1h00",
    note: "Enfant : moins de 12 ans."
  },
  {
    id: "kite-wing",
    name: "Navigation surveillée kitesurf & wingfoil",
    short: "Kite / wing",
    category: "Surveillance",
    kind: "perPerson",
    prices: { person: 12000 },
    duration: "3h00",
    note: "Prix par personne."
  },
  {
    id: "breakfast",
    name: "Petit-déj levée du jour",
    short: "Petit-déj",
    category: "Expérience",
    kind: "perPerson",
    prices: { person: 6000 },
    duration: "1h30",
    note: "Prix par personne."
  },
  {
    id: "sunset",
    name: "Apéro sunset",
    short: "Sunset",
    category: "Expérience",
    kind: "perPerson",
    prices: { person: 8000 },
    duration: "2h00",
    note: "Prix par personne."
  },
  {
    id: "half-day",
    name: "Excursion demi-journée",
    short: "Demi-journée",
    category: "Excursion",
    kind: "perPerson",
    prices: { person: 10000 },
    duration: "4h00",
    note: "Prix par personne."
  },
  {
    id: "full-day",
    name: "Excursion journée complète",
    short: "Journée",
    category: "Excursion",
    kind: "perPerson",
    prices: { person: 15000 },
    duration: "Journee complete",
    note: "Prix par personne."
  },
  {
    id: "private-half",
    name: "Privatisation du bateau - demi-journée",
    short: "Privé 1/2 j",
    category: "Privatisation",
    kind: "fixed",
    prices: { fixed: 80000 },
    duration: "4h00",
    note: "Prix par bateau."
  },
  {
    id: "private-full",
    name: "Privatisation du bateau - journée complète",
    short: "Privé journée",
    category: "Privatisation",
    kind: "quote",
    prices: {},
    duration: "Journee complete",
    note: "Nous consulter."
  }
];

const STORAGE_KEY = "mataRevaBookings.v1";
const PRICE_KEY = "mataRevaPrices.v1";
const SUPABASE_CONFIG = window.MATA_REVA_SUPABASE || {};
const supabaseClient = window.supabase && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey
  ? window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
  : null;

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XPF",
  maximumFractionDigits: 0
});

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "2-digit",
  month: "short"
});

const longDateFmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric"
});

let state = {
  activeTab: "planning",
  calendarMode: "day",
  currentDate: startOfDay(new Date()),
  bookings: loadBookings(),
  priceOverrides: loadPrices(),
  currentUser: null,
  authLoading: Boolean(supabaseClient),
  syncStatus: supabaseClient ? "Connexion au cloud..." : "Mode local",
  draft: null,
  editingId: null,
  detailId: null
};

const app = document.querySelector("#app");

function serviceById(id) {
  return SERVICE_DEFS.find((service) => service.id === id) || SERVICE_DEFS[0];
}

function durationFor(booking) {
  return booking.duration || serviceById(booking.serviceId).duration || "";
}

function pricesFor(serviceId) {
  const service = serviceById(serviceId);
  return { ...service.prices, ...(state.priceOverrides[serviceId] || {}) };
}

function loadBookings() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveBookings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookings));
}

function rowToBooking(row) {
  return {
    id: row.id,
    client: row.client || "",
    phone: row.phone || "",
    serviceId: row.service_id || "wave",
    date: row.date,
    time: String(row.time || "08:00").slice(0, 5),
    duration: row.duration || "",
    adults: Number(row.adults || 0),
    children: Number(row.children || 0),
    status: row.status || "option",
    paid: Number(row.paid || 0),
    notes: row.notes || "",
    tepariOut: row.tepari_out !== false,
    tepariBack: row.tepari_back !== false,
    waiver: Boolean(row.waiver),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function bookingToRow(booking) {
  return {
    id: booking.id,
    client: booking.client,
    phone: booking.phone,
    service_id: booking.serviceId,
    date: booking.date,
    time: booking.time,
    duration: durationFor(booking),
    adults: Number(booking.adults || 0),
    children: Number(booking.children || 0),
    status: booking.status,
    paid: Number(booking.paid || 0),
    notes: booking.notes,
    tepari_out: Boolean(booking.tepariOut),
    tepari_back: Boolean(booking.tepariBack),
    waiver: Boolean(booking.waiver),
    created_by: state.currentUser?.id || null
  };
}

function isCloudActive() {
  return Boolean(supabaseClient && state.currentUser);
}

async function loadCloudBookings() {
  if (!isCloudActive()) return;
  state.syncStatus = "Chargement cloud...";
  render();
  const { data, error } = await supabaseClient
    .from("bookings")
    .select("*")
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    state.syncStatus = `Erreur cloud : ${error.message}`;
    alert(`Erreur cloud Supabase : ${error.message}`);
    render();
    return;
  }

  const localBookings = loadBookings();
  if ((!data || data.length === 0) && localBookings.length > 0) {
    const shouldImport = confirm("Le cloud est vide. Importer les réservations locales dans Supabase ?");
    if (shouldImport) {
      const rows = localBookings.map(bookingToRow);
      const { data: importedRows, error: importError } = await supabaseClient
        .from("bookings")
        .upsert(rows, { onConflict: "id" })
        .select("*");
      if (importError) {
        state.syncStatus = `Erreur import cloud : ${importError.message}`;
        alert(`Import impossible dans Supabase : ${importError.message}`);
        render();
        return;
      }
      state.bookings = (importedRows || []).map(rowToBooking);
      saveBookings();
      state.syncStatus = `${state.bookings.length} réservation(s) importée(s) dans le cloud`;
      render();
      return;
    }
  }

  state.bookings = (data || []).map(rowToBooking);
  saveBookings();
  state.syncStatus = "Cloud synchronisé";
  render();
}

async function saveBookingRecord(booking) {
  if (!isCloudActive()) {
    saveBookings();
    return { ok: true };
  }

  const { error } = await supabaseClient
    .from("bookings")
    .upsert(bookingToRow(booking), { onConflict: "id" })
    .select("id")
    .single();

  if (error) {
    state.syncStatus = `Erreur sauvegarde cloud : ${error.message}`;
    saveBookings();
    alert(`La réservation est gardée en local, mais Supabase a refusé l'enregistrement : ${error.message}`);
    render();
    return { ok: false, error };
  }

  saveBookings();
  state.syncStatus = "Cloud synchronisé";
  return { ok: true };
}

async function deleteBookingRecord(id) {
  if (!isCloudActive()) {
    saveBookings();
    return { ok: true };
  }

  const { error } = await supabaseClient.from("bookings").delete().eq("id", id);
  if (error) {
    state.syncStatus = `Erreur suppression cloud : ${error.message}`;
    render();
    return { ok: false, error };
  }

  saveBookings();
  state.syncStatus = "Cloud synchronisé";
  return { ok: true };
}

function loadPrices() {
  try {
    return JSON.parse(localStorage.getItem(PRICE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function savePrices() {
  localStorage.setItem(PRICE_KEY, JSON.stringify(state.priceOverrides));
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function sameDate(a, b) {
  return toISODate(a) === toISODate(b);
}

function monthLabel(date) {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date);
}

function weekBounds(date) {
  const day = date.getDay() || 7;
  const start = addDays(startOfDay(date), 1 - day);
  return { start, end: addDays(start, 6) };
}

function formatMoney(amount) {
  if (amount === null) return "Nous consulter";
  return currency.format(amount).replace("XPF", "F");
}

function normalizeWhatsAppPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("689")) return digits;
  if (digits.length === 8) return `689${digits}`;
  return digits;
}

function passengerCount(booking) {
  return Number(booking.adults || 0) + Number(booking.children || 0);
}

function calculateTotal(booking) {
  const service = serviceById(booking.serviceId);
  const prices = pricesFor(service.id);
  const adults = Number(booking.adults || 0);
  const children = Number(booking.children || 0);
  const passengers = adults + children;

  if (service.kind === "adultChild") {
    return adults * Number(prices.adult || 0) + children * Number(prices.child || 0);
  }

  if (service.kind === "perPerson") {
    return passengers * Number(prices.person || 0);
  }

  if (service.kind === "tepari") {
    const segments = (booking.tepariOut ? Number(prices.aller || 0) : 0) + (booking.tepariBack ? Number(prices.retour || 0) : 0);
    return passengers * segments;
  }

  if (service.kind === "fixed") {
    return Number(prices.fixed || 0);
  }

  return null;
}

function slotLoad(date, time, ignoreId = null) {
  return state.bookings
    .filter((booking) => booking.id !== ignoreId)
    .filter((booking) => booking.status !== "cancelled")
    .filter((booking) => booking.date === date && booking.time === time)
    .reduce((sum, booking) => sum + passengerCount(booking), 0);
}

function dayLoad(date) {
  const iso = typeof date === "string" ? date : toISODate(date);
  return state.bookings
    .filter((booking) => booking.status !== "cancelled" && booking.date === iso)
    .reduce((sum, booking) => sum + passengerCount(booking), 0);
}

function bookingTemplate(overrides = {}) {
  return {
    id: uid(),
    client: "",
    phone: "",
    serviceId: "wave",
    date: toISODate(state.currentDate),
    time: "08:00",
    duration: serviceById("wave").duration,
    adults: 1,
    children: 0,
    status: "option",
    paid: 0,
    notes: "",
    tepariOut: true,
    tepariBack: true,
    waiver: false,
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render() {
  app.innerHTML = `
    <main class="app-shell">
      ${renderTopbar()}
      ${renderActiveTab()}
    </main>
    ${renderBottomNav()}
    ${state.detailId ? renderDetailModal(state.detailId) : ""}
  `;
  bindEvents();
}

function renderTopbar() {
  const today = toISODate(new Date());
  const todayBookings = state.bookings.filter((booking) => booking.date === today && booking.status !== "cancelled");
  const monthBookings = state.bookings.filter((booking) => booking.date?.startsWith(toISODate(state.currentDate).slice(0, 7)) && booking.status !== "cancelled");
  const due = state.bookings.reduce((sum, booking) => {
    const total = calculateTotal(booking);
    return total === null || booking.status === "cancelled" ? sum : sum + Math.max(0, total - Number(booking.paid || 0));
  }, 0);

  return `
    <header class="topbar">
      <div class="brand">
        <img class="brand-logo" src="./assets/logo-mata.jpg" alt="Logo Mata Reva" />
        <div>
          <h1 class="brand-title">Mata Reva Booking</h1>
          <p class="brand-subtitle">${COMPANY.departure}</p>
        </div>
      </div>
      ${state.currentUser ? `<button class="cloud-status" data-signout>Cloud</button>` : ""}
      <div class="quick-stats" aria-label="Résumé">
        <div class="stat-pill"><span class="stat-value">${todayBookings.length}</span><span class="stat-label">Aujourd'hui</span></div>
        <div class="stat-pill"><span class="stat-value">${monthBookings.length}</span><span class="stat-label">Ce mois</span></div>
        <div class="stat-pill"><span class="stat-value">${formatMoney(due)}</span><span class="stat-label">Reste à payer</span></div>
        ${state.currentUser ? `<button class="stat-pill signout-btn" data-signout><span class="stat-value">Cloud</span><span class="stat-label">Déconnexion</span></button>` : ""}
      </div>
    </header>
  `;
}

function renderActiveTab() {
  if (supabaseClient && state.authLoading) return renderAuthPanel("Connexion au cloud...");
  if (supabaseClient && !state.currentUser) return renderAuthPanel();
  if (state.activeTab === "new") return renderBookingForm();
  if (state.activeTab === "tariffs") return renderTariffs();
  return renderPlanning();
}

function renderBottomNav() {
  if (supabaseClient && !state.currentUser) return "";
  const items = [
    ["planning", "▦", "Planning"],
    ["new", "+", "Ajouter"],
    ["tariffs", "F", "Tarifs"]
  ];

  return `
    <nav class="bottom-nav" aria-label="Navigation">
      ${items
        .map(([tab, icon, label]) => `
          <button class="${state.activeTab === tab ? "active" : ""}" data-tab="${tab}">
            <span>${icon}</span>${label}
          </button>
        `)
        .join("")}
    </nav>
  `;
}

function renderAuthPanel(message = "") {
  return `
    <section class="auth-wrap">
      <form class="panel auth-card" id="authForm">
        <img class="auth-logo" src="./assets/logo-mata.jpg" alt="Logo Mata Reva" />
        <div>
          <p class="eyebrow">Cloud partagé</p>
          <h2>Connexion Mata Reva</h2>
          <p>Connecte-toi pour synchroniser les réservations sur Supabase.</p>
        </div>
        <div class="field">
          <label for="authEmail">Email</label>
          <input id="authEmail" name="email" type="email" autocomplete="email" required />
        </div>
        <div class="field">
          <label for="authPassword">Mot de passe</label>
          <input id="authPassword" name="password" type="password" autocomplete="current-password" minlength="6" required />
        </div>
        ${message || state.syncStatus ? `<div class="sync-note">${escapeHtml(message || state.syncStatus)}</div>` : ""}
        <div class="actions">
          <button class="primary-btn" type="submit" data-auth-action="signin">Connexion</button>
          <button class="secondary-btn" type="button" data-auth-action="signup">Créer le compte</button>
        </div>
      </form>
    </section>
  `;
}

function renderPlanning() {
  const label = state.calendarMode === "month"
    ? monthLabel(state.currentDate)
    : state.calendarMode === "week"
      ? `Semaine du ${dateFmt.format(weekBounds(state.currentDate).start)}`
      : longDateFmt.format(state.currentDate);

  return `
    <section>
      <div class="toolbar">
        <div class="toolbar-title">
          <p class="eyebrow">Planning</p>
          <h2>${escapeHtml(label)}</h2>
        </div>
        <div class="toolbar-actions">
          <button class="icon-btn" data-prev aria-label="Période précédente">‹</button>
          <button class="icon-btn" data-today aria-label="Aujourd'hui">•</button>
          <button class="icon-btn" data-next aria-label="Période suivante">›</button>
          <button class="primary-btn compact-label" data-new-for-date>Réserver</button>
        </div>
      </div>
      <div class="segmented" role="tablist" aria-label="Vue du planning">
        <button class="${state.calendarMode === "day" ? "active" : ""}" data-mode="day">Jour</button>
        <button class="${state.calendarMode === "week" ? "active" : ""}" data-mode="week">Semaine</button>
        <button class="${state.calendarMode === "month" ? "active" : ""}" data-mode="month">Mois</button>
      </div>
      <div class="content-grid">
        <div>${renderCalendar()}</div>
        <aside>${renderUpcoming()}</aside>
      </div>
    </section>
  `;
}

function renderCalendar() {
  if (state.calendarMode === "day") return renderDayView([state.currentDate], true);
  if (state.calendarMode === "week") {
    const { start } = weekBounds(state.currentDate);
    return renderDayView(Array.from({ length: 7 }, (_, index) => addDays(start, index)), false);
  }
  return renderMonthView();
}

function bookingsForDate(date) {
  const iso = typeof date === "string" ? date : toISODate(date);
  return state.bookings
    .filter((booking) => booking.date === iso)
    .sort((a, b) => `${a.time}${a.client}`.localeCompare(`${b.time}${b.client}`));
}

function renderMonthView() {
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = addDays(first, -startOffset);
  const days = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  const weekdays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return `
    <div class="panel calendar">
      <div class="calendar-head">${weekdays.map((day) => `<span>${day}</span>`).join("")}</div>
      <div class="calendar-grid">
        ${days.map((day) => renderMonthCell(day, day.getMonth() !== month)).join("")}
      </div>
    </div>
  `;
}

function renderMonthCell(day, muted) {
  const iso = toISODate(day);
  const bookings = bookingsForDate(iso);
  const visible = bookings.slice(0, 2);

  return `
    <div class="day-cell ${muted ? "muted" : ""} ${sameDate(day, new Date()) ? "today" : ""}" data-select-date="${iso}">
      <div class="day-number">
        <span>${day.getDate()}</span>
        <span class="capacity-dot">${dayLoad(iso)}/${CAPACITY}</span>
      </div>
      ${visible.map(renderBookingChip).join("")}
      ${bookings.length > visible.length ? `<button class="ghost-btn" data-open-day="${iso}">+${bookings.length - visible.length}</button>` : ""}
    </div>
  `;
}

function renderDayView(days, single) {
  return `
    <div class="list">
      ${days.map((day) => renderDayPanel(day, single)).join("")}
    </div>
  `;
}

function renderDayPanel(day, single) {
  const iso = toISODate(day);
  const bookings = bookingsForDate(iso);

  return `
    <section class="panel" data-select-date="${iso}">
      <div class="modal-head">
        <div>
          <p class="eyebrow">${dayLoad(iso)}/${CAPACITY} passagers</p>
          <h2>${escapeHtml(longDateFmt.format(day))}</h2>
        </div>
        <button class="icon-btn" data-new-date="${iso}" aria-label="Ajouter">+</button>
      </div>
      <div class="modal-body">
        ${bookings.length
          ? `<div class="list">${bookings.map(renderBookingCard).join("")}</div>`
          : `<div class="empty-state"><div><strong>Aucune réservation</strong>${single ? "Cette journée est libre." : "Créneau libre."}</div></div>`}
      </div>
    </section>
  `;
}

function renderBookingChip(booking) {
  const service = serviceById(booking.serviceId);
  return `
    <button class="booking-chip ${STATUS_CLASSES[booking.status] || ""}" data-detail="${booking.id}">
      <strong>${escapeHtml(booking.time)} · ${escapeHtml(service.short)}</strong>
      <span>${escapeHtml(booking.client || "Sans nom")} · ${passengerCount(booking)} pax</span>
    </button>
  `;
}

function renderBookingCard(booking) {
  const service = serviceById(booking.serviceId);
  const total = calculateTotal(booking);
  const paid = Number(booking.paid || 0);
  const due = total === null ? null : Math.max(0, total - paid);

  return `
    <article class="booking-card">
      <div class="booking-card-header">
        <div>
          <h3>${escapeHtml(booking.time)} · ${escapeHtml(booking.client || "Sans nom")}</h3>
          <p>${escapeHtml(service.name)} · ${escapeHtml(durationFor(booking))} · ${passengerCount(booking)}/${CAPACITY} passagers</p>
        </div>
        <span class="badge ${STATUS_CLASSES[booking.status] || ""}">${STATUSES[booking.status] || booking.status}</span>
      </div>
      <div class="meta-row">
        <span class="badge">${formatMoney(total)}</span>
        <span class="badge">Payé ${formatMoney(paid)}</span>
        <span class="badge">Reste ${formatMoney(due)}</span>
      </div>
      <div class="actions">
        <button class="secondary-btn" data-detail="${booking.id}">Détail</button>
        <a class="primary-btn" href="${whatsAppLink(booking, "confirmation")}" target="_blank" rel="noreferrer">WhatsApp</a>
      </div>
    </article>
  `;
}

function renderUpcoming() {
  const today = toISODate(new Date());
  const upcoming = state.bookings
    .filter((booking) => booking.status !== "cancelled" && booking.date >= today)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 6);

  return `
    <section class="panel">
      <div class="modal-head">
        <div>
          <p class="eyebrow">À venir</p>
          <h2>Prochains départs</h2>
        </div>
      </div>
      <div class="modal-body">
        ${upcoming.length
          ? `<div class="list">${upcoming.map(renderBookingCard).join("")}</div>`
          : `<div class="empty-state"><div><strong>Planning vide</strong>Ajoute la première réservation.</div></div>`}
      </div>
    </section>
  `;
}

function renderBookingForm() {
  const booking = state.draft || (state.editingId
    ? { ...(state.bookings.find((item) => item.id === state.editingId) || bookingTemplate()) }
    : bookingTemplate());
  const service = serviceById(booking.serviceId);
  const total = calculateTotal(booking);
  const load = slotLoad(booking.date, booking.time, state.editingId) + passengerCount(booking);
  const overCapacity = load > CAPACITY || passengerCount(booking) > CAPACITY;

  return `
    <section>
      <div class="toolbar">
        <div class="toolbar-title">
          <p class="eyebrow">${state.editingId ? "Modifier" : "Nouvelle réservation"}</p>
          <h2>${state.editingId ? escapeHtml(booking.client || "Réservation") : "Ajouter une sortie"}</h2>
        </div>
        ${state.editingId ? `<button class="secondary-btn" data-cancel-edit>Annuler</button>` : ""}
      </div>
      <form class="panel modal-body form" id="bookingForm">
        <div class="form-grid">
          <div class="field">
            <label for="client">Client</label>
            <input id="client" name="client" value="${escapeHtml(booking.client)}" autocomplete="name" required />
          </div>
          <div class="field">
            <label for="phone">Téléphone</label>
            <input id="phone" name="phone" value="${escapeHtml(booking.phone)}" inputmode="tel" autocomplete="tel" />
          </div>
          <div class="field full">
            <label for="serviceId">Prestation</label>
            <select id="serviceId" name="serviceId">
              ${SERVICE_DEFS.map((item) => `<option value="${item.id}" ${item.id === booking.serviceId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label for="date">Date</label>
            <input id="date" name="date" type="date" value="${escapeHtml(booking.date)}" required />
          </div>
          <div class="field">
            <label for="time">Heure</label>
            <input id="time" name="time" type="time" value="${escapeHtml(booking.time)}" required />
          </div>
          <div class="field">
            <label for="duration">Durée</label>
            <input id="duration" name="duration" value="${escapeHtml(durationFor(booking))}" placeholder="Ex : 1h30" />
          </div>
          <div class="field">
            <label for="adults">Adultes / personnes</label>
            <input id="adults" name="adults" type="number" min="0" max="12" value="${Number(booking.adults || 0)}" required />
          </div>
          <div class="field">
            <label for="children">Enfants -12 ans</label>
            <input id="children" name="children" type="number" min="0" max="12" value="${Number(booking.children || 0)}" />
          </div>
          <div class="field">
            <label for="status">Statut</label>
            <select id="status" name="status">
              ${Object.entries(STATUSES).map(([value, label]) => `<option value="${value}" ${value === booking.status ? "selected" : ""}>${label}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label for="paid">Payé</label>
            <input id="paid" name="paid" type="number" min="0" step="500" value="${Number(booking.paid || 0)}" />
          </div>
          ${service.kind === "tepari" ? `
            <div class="field full">
              <label>Trajets Te Pari</label>
              <label class="check-row"><input type="checkbox" name="tepariOut" ${booking.tepariOut ? "checked" : ""} /> Aller</label>
              <label class="check-row"><input type="checkbox" name="tepariBack" ${booking.tepariBack ? "checked" : ""} /> Retour</label>
            </div>
          ` : ""}
          ${service.requiresWaiver ? `
            <div class="field full">
              <label>Décharge</label>
              <label class="check-row"><input type="checkbox" name="waiver" ${booking.waiver ? "checked" : ""} /> Décharge surfeur signée</label>
            </div>
          ` : ""}
          <div class="field full">
            <label for="notes">Notes</label>
            <textarea id="notes" name="notes" placeholder="Lieu, météo, matériel, acompte...">${escapeHtml(booking.notes)}</textarea>
          </div>
        </div>
        ${renderTotalBand(booking, total, service, load, overCapacity)}
        <div class="actions">
          <button class="primary-btn" type="submit" ${overCapacity ? "disabled" : ""}>Enregistrer</button>
          ${state.editingId ? `<button class="danger-btn" type="button" data-delete="${booking.id}">Supprimer</button>` : ""}
        </div>
      </form>
    </section>
  `;
}

function renderTotalBand(booking, total, service, load, overCapacity) {
  return `
    <div class="total-band">
      <div class="total"><span>Total</span><strong>${formatMoney(total)}</strong></div>
      <div class="meta-row">
        <span class="badge">${passengerCount(booking)}/${CAPACITY} passagers</span>
        <span class="badge">Créneau ${load}/${CAPACITY}</span>
        <span class="badge">${escapeHtml(service.note)}</span>
      </div>
      ${overCapacity ? `<div class="warning">Capacité dépassée : le bateau est limité à ${CAPACITY} personnes.</div>` : ""}
      ${service.requiresWaiver && !booking.waiver ? `<div class="warning">Pense à faire signer la décharge pour cette dépose surfeur.</div>` : ""}
    </div>
  `;
}

function renderTariffs() {
  return `
    <section>
      <div class="toolbar">
        <div class="toolbar-title">
          <p class="eyebrow">Tarifs</p>
          <h2>Grille Mata Reva</h2>
        </div>
        <button class="secondary-btn" data-reset-prices>Réinitialiser</button>
      </div>
      <div class="tariff-grid">
        ${SERVICE_DEFS.map(renderTariffCard).join("")}
      </div>
    </section>
  `;
}

function priceLabel(key) {
  return {
    adult: "Adulte",
    child: "Enfant",
    person: "Personne",
    fixed: "Bateau",
    aller: "Aller",
    retour: "Retour"
  }[key] || key;
}

function renderTariffCard(service) {
  const prices = pricesFor(service.id);
  const entries = Object.entries(service.prices);
  return `
    <article class="tariff-card">
      <div>
        <span class="badge">${escapeHtml(service.category)}</span>
        <h3>${escapeHtml(service.name)}</h3>
        <p>${escapeHtml(service.note)}</p>
      </div>
      ${entries.length
        ? `<div class="price-editor">
            ${entries.map(([key]) => `
              <div class="field">
                <label>${priceLabel(key)}</label>
                <input type="number" min="0" step="500" value="${Number(prices[key] || 0)}" data-price-service="${service.id}" data-price-key="${key}" />
              </div>
            `).join("")}
          </div>`
        : `<strong>${formatMoney(null)}</strong>`}
    </article>
  `;
}

function renderDetailModal(id) {
  const booking = state.bookings.find((item) => item.id === id);
  if (!booking) return "";
  const service = serviceById(booking.serviceId);
  const total = calculateTotal(booking);
  const paid = Number(booking.paid || 0);
  const due = total === null ? null : Math.max(0, total - paid);
  const day = new Date(`${booking.date}T00:00:00`);

  return `
    <div class="modal-backdrop" data-close-modal>
      <article class="modal" role="dialog" aria-modal="true" aria-label="Détail réservation">
        <div class="modal-head">
          <div>
            <p class="eyebrow">${escapeHtml(service.category)}</p>
            <h2>${escapeHtml(booking.client || "Réservation")}</h2>
          </div>
          <button class="icon-btn" data-close-modal aria-label="Fermer">×</button>
        </div>
        <div class="modal-body">
          <article class="info-card">
            <h3>${escapeHtml(service.name)}</h3>
            <p>${escapeHtml(longDateFmt.format(day))} à ${escapeHtml(booking.time)} · Durée : ${escapeHtml(durationFor(booking))}</p>
            <p>${passengerCount(booking)}/${CAPACITY} passagers · ${STATUSES[booking.status]}</p>
            ${booking.phone ? `<p>Téléphone client : ${escapeHtml(booking.phone)}</p>` : ""}
            ${service.requiresWaiver ? `<p>Décharge surfeur : ${booking.waiver ? "signée" : "à signer"}</p>` : ""}
            ${service.kind === "tepari" ? `<p>Trajets : ${booking.tepariOut ? "aller" : ""}${booking.tepariOut && booking.tepariBack ? " + " : ""}${booking.tepariBack ? "retour" : ""}</p>` : ""}
            ${booking.notes ? `<p>${escapeHtml(booking.notes)}</p>` : ""}
          </article>
          <div class="money-row">
            <div class="money-box"><span>Total</span><strong>${formatMoney(total)}</strong></div>
            <div class="money-box"><span>Payé</span><strong>${formatMoney(paid)}</strong></div>
            <div class="money-box"><span>Reste</span><strong>${formatMoney(due)}</strong></div>
          </div>
          <article class="info-card">
            <h3>Messages WhatsApp</h3>
            <p>Choisis le modèle à transférer au client.</p>
            <div class="message-actions">
              ${MESSAGE_TYPES.map(([type, label]) => `
                <a class="${type === "confirmation" ? "primary-btn" : "secondary-btn"}" href="${whatsAppLink(booking, type)}" target="_blank" rel="noreferrer">${label}</a>
              `).join("")}
            </div>
          </article>
          <div class="actions">
            <button class="secondary-btn" data-edit="${booking.id}">Modifier</button>
            <button class="danger-btn" data-delete="${booking.id}">Supprimer</button>
          </div>
        </div>
      </article>
    </div>
  `;
}

function bookingFromForm(form, previous = {}) {
  const data = new FormData(form);
  const serviceId = String(data.get("serviceId") || previous.serviceId || "wave");
  const service = serviceById(serviceId);
  const booking = {
    ...bookingTemplate(previous),
    id: previous.id || uid(),
    client: String(data.get("client") || "").trim(),
    phone: String(data.get("phone") || "").trim(),
    serviceId,
    date: String(data.get("date") || toISODate(new Date())),
    time: String(data.get("time") || "08:00"),
    duration: String(data.get("duration") || service.duration || "").trim(),
    adults: Number(data.get("adults") || 0),
    children: service.kind === "adultChild" ? Number(data.get("children") || 0) : Number(data.get("children") || 0),
    status: String(data.get("status") || "option"),
    paid: Number(data.get("paid") || 0),
    notes: String(data.get("notes") || "").trim(),
    tepariOut: service.kind === "tepari" ? data.has("tepariOut") : true,
    tepariBack: service.kind === "tepari" ? data.has("tepariBack") : true,
    waiver: data.has("waiver"),
    updatedAt: new Date().toISOString()
  };

  return booking;
}

function whatsAppLink(booking, type = "confirmation") {
  const phone = normalizeWhatsAppPhone(booking.phone);
  const message = whatsAppMessage(booking, type);
  const target = phone ? `https://wa.me/${phone}` : "https://wa.me/";
  return `${target}?text=${encodeURIComponent(message)}`;
}

function whatsAppMessage(booking, type = "confirmation") {
  const service = serviceById(booking.serviceId);
  const total = calculateTotal(booking);
  const day = new Date(`${booking.date}T00:00:00`);
  const hello = `Ia ora na ${booking.client || ""}`.trim();
  const details = [
    `Prestation : ${service.name}`,
    `Date : ${longDateFmt.format(day)} à ${booking.time}`,
    `Durée : ${durationFor(booking)}`,
    `Passagers : ${passengerCount(booking)}`,
    `Départ : ${COMPANY.departure}`,
    `Total : ${formatMoney(total)}`
  ];

  const templates = {
    confirmation: [
      hello,
      `Votre réservation ${COMPANY.name} est confirmée.`,
      ...details,
      `Merci de nous prévenir en cas de changement. Contact : ${COMPANY.displayPhone}.`
    ],
    reminder: [
      hello,
      `Petit rappel pour votre sortie ${COMPANY.name} prévue demain.`,
      ...details,
      "Merci d'arriver quelques minutes avant le départ.",
      `Contact : ${COMPANY.displayPhone}.`
    ],
    weather: [
      hello,
      "En raison des conditions météo, nous devons ajuster l'organisation de votre sortie.",
      ...details,
      "Nous vous proposons de confirmer ensemble le maintien, le changement d'horaire ou le report.",
      `Contact : ${COMPANY.displayPhone}.`
    ],
    cancellation: [
      hello,
      `Nous sommes désolés, votre sortie ${COMPANY.name} doit être annulée.`,
      ...details,
      "Nous revenons vers vous pour voir une autre date possible.",
      `Contact : ${COMPANY.displayPhone}.`
    ],
    waiver: [
      hello,
      "Pour la dépose surfeur, une décharge est obligatoire avant le départ.",
      ...details,
      "Merci de prévoir la signature de la décharge avant l'embarquement.",
      `Contact : ${COMPANY.displayPhone}.`
    ]
  };

  return (templates[type] || templates.confirmation).join("\n");
}

function updateFormSummary(form, booking) {
  const service = serviceById(booking.serviceId);
  const total = calculateTotal(booking);
  const load = slotLoad(booking.date, booking.time, state.editingId) + passengerCount(booking);
  const overCapacity = load > CAPACITY || passengerCount(booking) > CAPACITY;
  const band = form.querySelector(".total-band");
  if (band) band.outerHTML = renderTotalBand(booking, total, service, load, overCapacity);
  const submit = form.querySelector('button[type="submit"]');
  if (submit) submit.disabled = overCapacity;
}

async function handleAuth(form, action) {
  if (!supabaseClient) return;
  const data = new FormData(form);
  const email = String(data.get("email") || "").trim();
  const password = String(data.get("password") || "");
  if (!email || !password) return;

  state.syncStatus = action === "signup" ? "Création du compte..." : "Connexion...";
  render();

  const result = action === "signup"
    ? await supabaseClient.auth.signUp({ email, password })
    : await supabaseClient.auth.signInWithPassword({ email, password });

  if (result.error) {
    state.syncStatus = result.error.message;
    render();
    return;
  }

  if (action === "signup" && !result.data.session) {
    state.currentUser = null;
    state.authLoading = false;
    state.syncStatus = "Compte créé. Vérifie l'email de confirmation, puis connecte-toi.";
    render();
    return;
  }

  state.currentUser = result.data.session?.user || result.data.user || null;
  state.authLoading = false;
  state.syncStatus = "Connecté";
  await loadCloudBookings();
}

function bindEvents() {
  const authForm = document.querySelector("#authForm");
  if (authForm) {
    authForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await handleAuth(authForm, "signin");
    });
    authForm.querySelector('[data-auth-action="signup"]')?.addEventListener("click", async () => {
      await handleAuth(authForm, "signup");
    });
  }

  document.querySelector("[data-signout]")?.addEventListener("click", async () => {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    state.currentUser = null;
    state.bookings = loadBookings();
    state.syncStatus = "Déconnecté";
    render();
  });

  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      state.editingId = null;
      state.draft = button.dataset.tab === "new" ? bookingTemplate() : null;
      render();
    });
  });

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.calendarMode = button.dataset.mode;
      render();
    });
  });

  document.querySelector("[data-prev]")?.addEventListener("click", () => {
    state.currentDate = state.calendarMode === "month"
      ? new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() - 1, 1)
      : addDays(state.currentDate, state.calendarMode === "week" ? -7 : -1);
    render();
  });

  document.querySelector("[data-next]")?.addEventListener("click", () => {
    state.currentDate = state.calendarMode === "month"
      ? new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + 1, 1)
      : addDays(state.currentDate, state.calendarMode === "week" ? 7 : 1);
    render();
  });

  document.querySelector("[data-today]")?.addEventListener("click", () => {
    state.currentDate = startOfDay(new Date());
    render();
  });

  document.querySelector("[data-new-for-date]")?.addEventListener("click", () => {
    state.activeTab = "new";
    state.editingId = null;
    state.draft = bookingTemplate({ date: toISODate(state.currentDate) });
    render();
  });

  document.querySelectorAll("[data-new-date]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      state.currentDate = new Date(`${button.dataset.newDate}T00:00:00`);
      state.activeTab = "new";
      state.editingId = null;
      state.draft = bookingTemplate({ date: button.dataset.newDate });
      render();
    });
  });

  document.querySelectorAll("[data-select-date]").forEach((element) => {
    element.addEventListener("dblclick", () => {
      state.currentDate = new Date(`${element.dataset.selectDate}T00:00:00`);
      state.calendarMode = "day";
      render();
    });
  });

  document.querySelectorAll("[data-open-day]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      state.currentDate = new Date(`${button.dataset.openDay}T00:00:00`);
      state.calendarMode = "day";
      render();
    });
  });

  document.querySelectorAll("[data-detail]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      state.detailId = button.dataset.detail;
      render();
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((element) => {
    element.addEventListener("click", (event) => {
      if (event.target === element || element.matches("button")) {
        state.detailId = null;
        render();
      }
    });
  });

  document.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      state.editingId = button.dataset.edit;
      state.draft = { ...(state.bookings.find((booking) => booking.id === state.editingId) || {}) };
      state.detailId = null;
      state.activeTab = "new";
      render();
    });
  });

  document.querySelector("[data-cancel-edit]")?.addEventListener("click", () => {
    state.editingId = null;
    state.draft = null;
    state.activeTab = "planning";
    render();
  });

  document.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      const booking = state.bookings.find((item) => item.id === button.dataset.delete);
      if (!booking || !confirm(`Supprimer la réservation de ${booking.client || "ce client"} ?`)) return;
      state.bookings = state.bookings.filter((item) => item.id !== booking.id);
      await deleteBookingRecord(booking.id);
      state.editingId = null;
      state.draft = null;
      state.detailId = null;
      state.activeTab = "planning";
      render();
    });
  });

  const form = document.querySelector("#bookingForm");
  if (form) {
    form.addEventListener("change", handleFormSoftChange);
    form.addEventListener("input", handleFormSoftChange);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const previous = state.editingId ? state.bookings.find((booking) => booking.id === state.editingId) || {} : {};
      const booking = bookingFromForm(form, previous);
      const load = slotLoad(booking.date, booking.time, state.editingId) + passengerCount(booking);

      if (passengerCount(booking) < 1) {
        alert("Ajoute au moins une personne.");
        return;
      }

      if (load > CAPACITY || passengerCount(booking) > CAPACITY) {
        alert(`Capacité dépassée : ${CAPACITY} personnes maximum.`);
        return;
      }

      if (state.editingId) {
        state.bookings = state.bookings.map((item) => item.id === state.editingId ? booking : item);
      } else {
        state.bookings = [...state.bookings, booking];
      }

      await saveBookingRecord(booking);
      state.currentDate = new Date(`${booking.date}T00:00:00`);
      state.editingId = null;
      state.draft = null;
      state.activeTab = "planning";
      render();
    });
  }

  document.querySelectorAll("[data-price-service]").forEach((input) => {
    input.addEventListener("change", () => {
      const serviceId = input.dataset.priceService;
      const key = input.dataset.priceKey;
      state.priceOverrides[serviceId] = {
        ...(state.priceOverrides[serviceId] || {}),
        [key]: Number(input.value || 0)
      };
      savePrices();
      render();
    });
  });

  document.querySelector("[data-reset-prices]")?.addEventListener("click", () => {
    if (!confirm("Revenir aux tarifs d'origine ?")) return;
    state.priceOverrides = {};
    savePrices();
    render();
  });

  document.querySelector("[data-export]")?.addEventListener("click", () => {
    const rows = [
      ["Date", "Heure", "Client", "Téléphone", "Prestation", "Adultes", "Enfants", "Statut", "Total", "Payé", "Notes"],
      ...state.bookings.map((booking) => [
        booking.date,
        booking.time,
        booking.client,
        booking.phone,
        serviceById(booking.serviceId).name,
        booking.adults,
        booking.children,
        STATUSES[booking.status],
        calculateTotal(booking),
        booking.paid,
        booking.notes
      ])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mata-reva-reservations-${toISODate(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  });

  document.querySelector("[data-clear-all]")?.addEventListener("click", () => {
    if (!confirm("Effacer toutes les réservations de cet appareil ?")) return;
    state.bookings = [];
    saveBookings();
    render();
  });
}

let formChangeTimer = null;
function handleFormSoftChange(event) {
  if (event.target?.matches?.("[data-price-service]")) return;
  clearTimeout(formChangeTimer);
  formChangeTimer = setTimeout(() => {
    const form = document.querySelector("#bookingForm");
    if (!form) return;
    const previous = state.editingId ? state.bookings.find((booking) => booking.id === state.editingId) || {} : {};
    state.draft = bookingFromForm(form, previous);
    if (event.target?.name === "serviceId") {
      state.draft.duration = serviceById(state.draft.serviceId).duration || "";
      render();
      return;
    }
    updateFormSummary(form, state.draft);
  }, 180);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

async function initApp() {
  if (!supabaseClient) {
    state.authLoading = false;
    state.syncStatus = "Mode local";
    render();
    return;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    state.authLoading = false;
    state.syncStatus = error.message;
    render();
    return;
  }

  state.currentUser = data.session?.user || null;
  state.authLoading = false;

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    state.currentUser = session?.user || null;
    state.authLoading = false;
    if (state.currentUser) {
      await loadCloudBookings();
    } else {
      state.bookings = loadBookings();
      state.syncStatus = "Déconnecté";
      render();
    }
  });

  if (state.currentUser) {
    await loadCloudBookings();
  } else {
    state.syncStatus = "Connecte-toi pour activer le cloud";
    render();
  }
}

initApp();
