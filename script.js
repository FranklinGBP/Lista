const products = [
  { id: "panales-talla-1", name: "Pañales talla 1", category: "Higiene", priority: "imprescindible", description: "Para los primeros días." },
  { id: "toallitas-agua", name: "Toallitas al agua", category: "Higiene", priority: "imprescindible", description: "Suaves y prácticas para casa o paseo." },
  { id: "crema-panial", name: "Crema para el pañal", category: "Higiene", priority: "imprescindible", description: "Para proteger la piel del bebé." },
  { id: "bodys-algodon", name: "Bodys de algodón", category: "Ropa", priority: "imprescindible", description: "Pack de bodys cómodos para recién nacido." },
  { id: "pijamas", name: "Pijamas enteros", category: "Ropa", priority: "imprescindible", description: "Mejor con apertura fácil para cambiarlo." },
  { id: "muselinas", name: "Muselinas", category: "Textil", priority: "imprescindible", description: "Sirven para casi todo y siempre hacen falta." },
  { id: "mantita", name: "Mantita suave", category: "Textil", priority: "recomendado", description: "Para paseo, sofá o visitas." },
  { id: "termometro", name: "Termómetro digital", category: "Salud", priority: "imprescindible", description: "Básico para tener en casa." },
  { id: "banera", name: "Bañera o soporte de baño", category: "Baño", priority: "recomendado", description: "Para bañar al bebé con comodidad." },
  { id: "gel-bebe", name: "Gel y champú bebé", category: "Baño", priority: "recomendado", description: "Producto suave para recién nacido." },
  { id: "cambiador", name: "Cambiador portátil", category: "Paseo", priority: "recomendado", description: "Muy útil para salir de casa." },
  { id: "chupetes", name: "Chupetes recién nacido", category: "Accesorios", priority: "opcional", description: "Puede ir bien tener alguno preparado." },
  { id: "biberones", name: "Biberones anticólicos", category: "Alimentación", priority: "opcional", description: "Útiles si se combinan tomas o se necesitan." },
  { id: "baberos", name: "Baberos pequeños", category: "Alimentación", priority: "recomendado", description: "Para tomas y babitas." },
  { id: "mochila-panales", name: "Mochila para pañales", category: "Paseo", priority: "opcional", description: "Para llevar lo básico del bebé." }
];

const productLinks = window.PRODUCT_LINKS || {};
const appConfig = window.APP_CONFIG || {};
const stateKey = `baby-list-reservations-${appConfig.listId || "local"}`;
const hasSupabase = Boolean(appConfig.supabaseUrl && appConfig.supabaseAnonKey);
const apiBaseUrl = hasSupabase ? `${appConfig.supabaseUrl}/rest/v1/baby_reservations` : "";
const listId = appConfig.listId || "familia-bebe";
const refreshIntervalMs = 12000;

let activeFilter = "todos";
let reservations = JSON.parse(localStorage.getItem(stateKey) || "{}");
let isSaving = false;

const list = document.querySelector("#lista");
const template = document.querySelector("#itemTemplate");
const filters = document.querySelector("#filters");
const totalItems = document.querySelector("#totalItems");
const pendingItems = document.querySelector("#pendingItems");
const reservedItems = document.querySelector("#reservedItems");
const shareButton = document.querySelector("#shareButton");
const syncStatus = document.querySelector("#syncStatus");

function getHeaders(extraHeaders = {}) {
  return {
    apikey: appConfig.supabaseAnonKey,
    Authorization: `Bearer ${appConfig.supabaseAnonKey}`,
    "Content-Type": "application/json",
    ...extraHeaders
  };
}

function saveLocalReservations() {
  localStorage.setItem(stateKey, JSON.stringify(reservations));
}

function setStatus(message, type = "") {
  syncStatus.textContent = message;
  syncStatus.className = `sync-status ${type}`.trim();
}

function reservationsFromRows(rows) {
  return rows.reduce((acc, row) => {
    if (row.item_id && row.reserved_by) acc[row.item_id] = row.reserved_by;
    return acc;
  }, {});
}

async function loadRemoteReservations({ silent = false } = {}) {
  if (!hasSupabase) {
    setStatus("Modo local: falta configurar Supabase para compartir reservas.", "warn");
    return;
  }

  try {
    if (!silent) setStatus("Sincronizando lista...");
    const url = `${apiBaseUrl}?list_id=eq.${encodeURIComponent(listId)}&select=item_id,reserved_by`;
    const response = await fetch(url, { headers: getHeaders({ "Cache-Control": "no-cache" }) });
    if (!response.ok) throw new Error(`Error cargando reservas: ${response.status}`);

    const rows = await response.json();
    reservations = reservationsFromRows(rows);
    saveLocalReservations();
    updateStats();
    renderProducts();
    setStatus("Lista sincronizada.", "ok");
  } catch (error) {
    console.error(error);
    setStatus("No se pudo sincronizar. Se muestran los datos de este móvil.", "warn");
  }
}

async function reserveRemote(productId, reservedBy) {
  if (!hasSupabase) {
    reservations[productId] = reservedBy;
    saveLocalReservations();
    return;
  }

  const response = await fetch(apiBaseUrl, {
    method: "POST",
    headers: getHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify({ list_id: listId, item_id: productId, reserved_by: reservedBy, updated_at: new Date().toISOString() })
  });

  if (!response.ok) throw new Error(`Error reservando: ${response.status}`);
  reservations[productId] = reservedBy;
  saveLocalReservations();
}

async function releaseRemote(productId) {
  if (!hasSupabase) {
    delete reservations[productId];
    saveLocalReservations();
    return;
  }

  const url = `${apiBaseUrl}?list_id=eq.${encodeURIComponent(listId)}&item_id=eq.${encodeURIComponent(productId)}`;
  const response = await fetch(url, { method: "DELETE", headers: getHeaders({ Prefer: "return=minimal" }) });
  if (!response.ok) throw new Error(`Error liberando: ${response.status}`);

  delete reservations[productId];
  saveLocalReservations();
}

function getFilteredProducts() {
  return products.filter((product) => {
    const isReserved = Boolean(reservations[product.id]);
    if (activeFilter === "todos") return true;
    if (activeFilter === "pendiente") return !isReserved;
    if (activeFilter === "reservado") return isReserved;
    if (activeFilter === "imprescindible") return product.priority === "imprescindible";
    return true;
  });
}

function updateStats() {
  const reserved = products.filter((product) => Boolean(reservations[product.id])).length;
  totalItems.textContent = products.length;
  pendingItems.textContent = products.length - reserved;
  reservedItems.textContent = reserved;
}

function renderProducts() {
  list.innerHTML = "";
  const filteredProducts = getFilteredProducts();

  filteredProducts.forEach((product) => {
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector(".card");
    const category = clone.querySelector(".category");
    const priority = clone.querySelector(".priority");
    const title = clone.querySelector("h2");
    const description = clone.querySelector(".description");
    const input = clone.querySelector("input");
    const button = clone.querySelector(".reserve-button");
    const reservedByText = clone.querySelector(".reserved-by");
    const buyLink = clone.querySelector(".buy-link");
    const reservedBy = reservations[product.id] || "";
    const purchaseUrl = (productLinks[product.id] || "").trim();

    category.textContent = product.category;
    priority.textContent = product.priority;
    priority.classList.toggle("imprescindible", product.priority === "imprescindible");
    title.textContent = product.name;
    description.textContent = product.description;
    input.value = reservedBy;
    button.disabled = isSaving;

    if (purchaseUrl) {
      buyLink.href = purchaseUrl;
      buyLink.textContent = "Ver compra";
      buyLink.classList.remove("empty");
    } else {
      buyLink.removeAttribute("href");
      buyLink.textContent = "Sin link";
      buyLink.classList.add("empty");
    }

    if (reservedBy) {
      card.classList.add("reserved");
      reservedByText.hidden = false;
      reservedByText.textContent = `Cogido por ${reservedBy}`;
      button.textContent = "Liberar";
    }

    button.addEventListener("click", async () => {
      const name = input.value.trim();
      if (!reservations[product.id] && !name) {
        input.focus();
        input.placeholder = "Escribe tu nombre";
        return;
      }

      try {
        isSaving = true;
        renderProducts();
        setStatus("Guardando...");

        if (reservations[product.id]) await releaseRemote(product.id);
        else await reserveRemote(product.id, name);

        await loadRemoteReservations({ silent: true });
      } catch (error) {
        console.error(error);
        setStatus("No se pudo guardar el cambio.", "warn");
      } finally {
        isSaving = false;
        updateStats();
        renderProducts();
      }
    });

    list.appendChild(clone);
  });

  if (filteredProducts.length === 0) {
    list.innerHTML = `<article class="card"><h2>No hay productos aquí</h2><p class="description">Prueba con otro filtro.</p></article>`;
  }
}

filters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (!button) return;
  activeFilter = button.dataset.filter;
  document.querySelectorAll(".filter").forEach((filter) => filter.classList.remove("active"));
  button.classList.add("active");
  renderProducts();
});

shareButton.addEventListener("click", async () => {
  const shareData = { title: "Lista para el bebé", text: "Te paso la lista del bebé.", url: window.location.href };
  if (navigator.share) {
    await navigator.share(shareData);
    return;
  }
  await navigator.clipboard.writeText(window.location.href);
  shareButton.textContent = "Enlace copiado";
  setTimeout(() => { shareButton.textContent = "Compartir"; }, 1800);
});

updateStats();
renderProducts();
loadRemoteReservations();
if (hasSupabase) setInterval(() => loadRemoteReservations({ silent: true }), refreshIntervalMs);
