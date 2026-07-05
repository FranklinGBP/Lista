const products = [
  {
    id: "panales-talla-1",
    name: "Pañales talla 1",
    category: "Higiene",
    priority: "imprescindible",
    description: "Para los primeros días. Mejor comprar pocas unidades al principio por si hay que cambiar de marca o talla."
  },
  {
    id: "toallitas-agua",
    name: "Toallitas al agua",
    category: "Higiene",
    priority: "imprescindible",
    description: "Útiles para casa y para salir. Las más suaves suelen ir mejor para recién nacido."
  },
  {
    id: "crema-panial",
    name: "Crema para el pañal",
    category: "Higiene",
    priority: "imprescindible",
    description: "Para proteger la piel y evitar irritaciones en los primeros meses."
  },
  {
    id: "bodys-algodon",
    name: "Bodys de algodón",
    category: "Ropa",
    priority: "imprescindible",
    description: "Mejor en pack y de algodón suave. Tallas 0-1 y 1-3 meses son las más prácticas."
  },
  {
    id: "pijamas",
    name: "Pijamas enteros",
    category: "Ropa",
    priority: "imprescindible",
    description: "Cómodos para dormir y fáciles de cambiar. Mejor con apertura frontal o cremallera."
  },
  {
    id: "muselinas",
    name: "Muselinas",
    category: "Textil",
    priority: "imprescindible",
    description: "Sirven para arropar, tapar, limpiar o apoyar al bebé. Siempre acaban haciendo falta."
  },
  {
    id: "mantita",
    name: "Mantita suave",
    category: "Textil",
    priority: "recomendado",
    description: "Para paseo, sofá o visitas. Mejor que sea ligera y fácil de lavar."
  },
  {
    id: "termometro",
    name: "Termómetro digital",
    category: "Salud",
    priority: "imprescindible",
    description: "Básico para tener en casa desde el primer día."
  },
  {
    id: "banera",
    name: "Bañera o soporte de baño",
    category: "Baño",
    priority: "recomendado",
    description: "Ayuda a bañar al bebé con más seguridad y comodidad."
  },
  {
    id: "gel-bebe",
    name: "Gel y champú bebé",
    category: "Baño",
    priority: "recomendado",
    description: "Producto suave para recién nacido, idealmente sin perfume fuerte."
  },
  {
    id: "cambiador",
    name: "Cambiador portátil",
    category: "Paseo",
    priority: "recomendado",
    description: "Muy útil para salir de casa y cambiar al bebé en cualquier sitio."
  },
  {
    id: "chupetes",
    name: "Chupetes recién nacido",
    category: "Accesorios",
    priority: "opcional",
    description: "No siempre se usan, pero puede ir bien tener un par preparados."
  },
  {
    id: "biberones",
    name: "Biberones anticólicos",
    category: "Alimentación",
    priority: "opcional",
    description: "Útiles si se combina lactancia, se extrae leche o finalmente se necesita fórmula."
  },
  {
    id: "baberos",
    name: "Baberos pequeños",
    category: "Alimentación",
    priority: "recomendado",
    description: "Para tomas, babitas y primeros meses. Mejor que sean fáciles de lavar."
  },
  {
    id: "mochila-panales",
    name: "Mochila para pañales",
    category: "Paseo",
    priority: "opcional",
    description: "Cómoda para llevar pañales, ropa de cambio, toallitas y biberón."
  }
];

const stateKey = "baby-list-reservations";
let activeFilter = "todos";
let reservations = JSON.parse(localStorage.getItem(stateKey) || "{}");

const list = document.querySelector("#lista");
const template = document.querySelector("#itemTemplate");
const filters = document.querySelector("#filters");
const totalItems = document.querySelector("#totalItems");
const pendingItems = document.querySelector("#pendingItems");
const reservedItems = document.querySelector("#reservedItems");
const summaryTitle = document.querySelector("#summaryTitle");
const summaryText = document.querySelector("#summaryText");
const shareButton = document.querySelector("#shareButton");

function saveReservations() {
  localStorage.setItem(stateKey, JSON.stringify(reservations));
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
  const pending = products.length - reserved;

  totalItems.textContent = products.length;
  pendingItems.textContent = pending;
  reservedItems.textContent = reserved;

  summaryTitle.textContent = pending === 0 ? "Lista completada" : "Preparando la llegada";
  summaryText.textContent = pending === 0
    ? "Todos los productos están reservados."
    : `${pending} productos pendientes y ${reserved} reservados.`;
}

function renderProducts() {
  list.innerHTML = "";

  const filteredProducts = getFilteredProducts();

  filteredProducts.forEach((product) => {
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector(".item-card");
    const category = clone.querySelector(".category");
    const priority = clone.querySelector(".priority");
    const title = clone.querySelector("h3");
    const description = clone.querySelector(".description");
    const input = clone.querySelector("input");
    const button = clone.querySelector(".reserve-button");
    const reservedBy = reservations[product.id] || "";

    category.textContent = product.category;
    priority.textContent = product.priority;
    priority.classList.toggle("imprescindible", product.priority === "imprescindible");
    title.textContent = product.name;
    description.textContent = product.description;
    input.value = reservedBy;

    if (reservedBy) {
      card.classList.add("reserved");
      button.textContent = "Liberar";
    }

    button.addEventListener("click", () => {
      const name = input.value.trim();

      if (reservations[product.id]) {
        delete reservations[product.id];
      } else if (name) {
        reservations[product.id] = name;
      } else {
        input.focus();
        input.placeholder = "Escribe tu nombre primero";
        return;
      }

      saveReservations();
      updateStats();
      renderProducts();
    });

    input.addEventListener("change", () => {
      const name = input.value.trim();
      if (reservations[product.id] && name) {
        reservations[product.id] = name;
        saveReservations();
        renderProducts();
      }
    });

    list.appendChild(clone);
  });

  if (filteredProducts.length === 0) {
    list.innerHTML = `<article class="item-card"><h3>No hay productos en este filtro</h3><p class="description">Prueba con otro filtro para ver más elementos.</p></article>`;
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
  const shareData = {
    title: "Lista para el bebé",
    text: "Te paso la lista de cosas para comprar al bebé.",
    url: window.location.href
  };

  if (navigator.share) {
    await navigator.share(shareData);
    return;
  }

  await navigator.clipboard.writeText(window.location.href);
  shareButton.textContent = "Enlace copiado";
  setTimeout(() => {
    shareButton.textContent = "Compartir";
  }, 1800);
});

updateStats();
renderProducts();
