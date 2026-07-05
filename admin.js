const appConfig = window.APP_CONFIG || {};
const listId = appConfig.listId || "familia-bebe-2026";
const loginBox = document.querySelector("#loginBox");
const adminBox = document.querySelector("#adminBox");
const adminStatus = document.querySelector("#adminStatus");
const productList = document.querySelector("#productList");
const loginButton = document.querySelector("#loginButton");
const logoutButton = document.querySelector("#logoutButton");
const saveButton = document.querySelector("#saveButton");
const newButton = document.querySelector("#newButton");
const formTitle = document.querySelector("#formTitle");

const fields = {
  id: document.querySelector("#productId"),
  name: document.querySelector("#name"),
  description: document.querySelector("#description"),
  category: document.querySelector("#category"),
  priority: document.querySelector("#priority"),
  purchaseUrl: document.querySelector("#purchaseUrl"),
  sortOrder: document.querySelector("#sortOrder"),
  isActive: document.querySelector("#isActive")
};

let client = null;
let products = [];

function setStatus(message, type = "") {
  adminStatus.textContent = message;
  adminStatus.className = `sync-status ${type}`.trim();
}

function requireConfig() {
  if (!appConfig.supabaseUrl || !appConfig.supabaseAnonKey) {
    loginBox.innerHTML = `<h2>Falta configurar Supabase</h2><p class="description">Rellena supabaseUrl y supabaseAnonKey en config.js.</p>`;
    return false;
  }
  client = window.supabase.createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey);
  return true;
}

function resetForm() {
  fields.id.value = "";
  fields.name.value = "";
  fields.description.value = "";
  fields.category.value = "";
  fields.priority.value = "recomendado";
  fields.purchaseUrl.value = "";
  fields.sortOrder.value = "100";
  fields.isActive.checked = true;
  formTitle.textContent = "Añadir producto";
}

function fillForm(product) {
  fields.id.value = product.id;
  fields.name.value = product.name || "";
  fields.description.value = product.description || "";
  fields.category.value = product.category || "";
  fields.priority.value = product.priority || "recomendado";
  fields.purchaseUrl.value = product.purchase_url || "";
  fields.sortOrder.value = product.sort_order ?? 100;
  fields.isActive.checked = Boolean(product.is_active);
  formTitle.textContent = "Editar producto";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderProducts() {
  productList.innerHTML = "";

  if (products.length === 0) {
    productList.innerHTML = `<article class="card"><h2>No hay productos</h2><p class="description">Añade el primero desde el formulario.</p></article>`;
    return;
  }

  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = `card ${product.is_active ? "" : "reserved"}`;
    card.innerHTML = `
      <div class="card-top">
        <span class="category">${product.category || "General"}</span>
        <span class="priority ${product.priority === "imprescindible" ? "imprescindible" : ""}">${product.priority || "recomendado"}</span>
      </div>
      <h2>${product.name}</h2>
      <p class="description">${product.description || ""}</p>
      <p class="description">${product.purchase_url ? "Tiene link de compra" : "Sin link de compra"}</p>
      <div class="actions">
        <button class="buy-link" data-action="edit" data-id="${product.id}">Editar</button>
        <button class="reserve-button" data-action="delete" data-id="${product.id}">Eliminar</button>
      </div>
    `;
    productList.appendChild(card);
  });
}

async function loadProducts() {
  setStatus("Cargando productos...");
  const { data, error } = await client
    .from("baby_products")
    .select("id,name,description,category,priority,purchase_url,sort_order,is_active")
    .eq("list_id", listId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    setStatus("No se pudieron cargar productos. Revisa permisos/RLS.", "warn");
    return;
  }

  products = data || [];
  renderProducts();
  setStatus("Productos cargados.", "ok");
}

async function saveProduct() {
  const payload = {
    list_id: listId,
    name: fields.name.value.trim(),
    description: fields.description.value.trim(),
    category: fields.category.value.trim() || "General",
    priority: fields.priority.value,
    purchase_url: fields.purchaseUrl.value.trim(),
    sort_order: Number(fields.sortOrder.value || 100),
    is_active: fields.isActive.checked,
    updated_at: new Date().toISOString()
  };

  if (!payload.name) {
    setStatus("El nombre es obligatorio.", "warn");
    fields.name.focus();
    return;
  }

  saveButton.disabled = true;
  setStatus("Guardando producto...");

  let result;
  if (fields.id.value) {
    result = await client.from("baby_products").update(payload).eq("id", fields.id.value);
  } else {
    result = await client.from("baby_products").insert(payload);
  }

  saveButton.disabled = false;

  if (result.error) {
    console.error(result.error);
    setStatus("No se pudo guardar. Revisa que este usuario esté en baby_admins.", "warn");
    return;
  }

  resetForm();
  await loadProducts();
}

async function deleteProduct(productId) {
  const product = products.find((item) => item.id === productId);
  const ok = confirm(`¿Eliminar "${product?.name || "este producto"}"?`);
  if (!ok) return;

  setStatus("Eliminando producto...");
  await client.from("baby_reservations").delete().eq("list_id", listId).eq("item_id", productId);
  const { error } = await client.from("baby_products").delete().eq("id", productId);

  if (error) {
    console.error(error);
    setStatus("No se pudo eliminar. Revisa permisos/RLS.", "warn");
    return;
  }

  await loadProducts();
}

async function login() {
  const email = document.querySelector("#email").value.trim();
  const password = document.querySelector("#password").value;

  if (!email || !password) return;
  loginButton.disabled = true;

  const { error } = await client.auth.signInWithPassword({ email, password });
  loginButton.disabled = false;

  if (error) {
    loginBox.insertAdjacentHTML("beforeend", `<p class="sync-status warn">No se pudo iniciar sesión.</p>`);
    return;
  }

  loginBox.hidden = true;
  adminBox.hidden = false;
  await loadProducts();
}

async function logout() {
  await client.auth.signOut();
  adminBox.hidden = true;
  loginBox.hidden = false;
}

productList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const product = products.find((item) => item.id === button.dataset.id);
  if (button.dataset.action === "edit" && product) fillForm(product);
  if (button.dataset.action === "delete") deleteProduct(button.dataset.id);
});

loginButton.addEventListener("click", login);
logoutButton.addEventListener("click", logout);
saveButton.addEventListener("click", saveProduct);
newButton.addEventListener("click", resetForm);

(async function init() {
  if (!requireConfig()) return;
  const { data } = await client.auth.getSession();
  if (data.session) {
    loginBox.hidden = true;
    adminBox.hidden = false;
    await loadProducts();
  }
})();
