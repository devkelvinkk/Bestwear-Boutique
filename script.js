let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// ====== Format currency in Kenyan Shillings ======
function formatKsh(amount) {
  return `Ksh ${Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
}

// ====== Fetch Products ======
fetch('./products.json') 
  .then(res => res.json())
  .then(data => {
    products = data;
    displayProducts(products);
    updateCartCount();
  })
  .catch(err => {
    console.error('Failed to load products.json', err);
  });

// ====== Display Products ======
function displayProducts(productList) {
  const container = document.getElementById('product-list');
  if (!container) return;

  container.innerHTML = '';
  productList.forEach(product => {
    const div = document.createElement('div');
    div.className = 'product';
    div.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <div class="rating">${generateStars(product.rating || 4)}</div>
      <p>${formatKsh(product.price)}</p>
      <div class="product-buttons">
        <button onclick="addToCart(${product.id})">Add to Cart</button>
        <button onclick="viewDetails(${product.id})" class="details-btn">View Details</button>
      </div>
    `;
    container.appendChild(div);
  });
}

// helper: read-only stars
function generateStars(rating) {
  const full = Math.round(rating || 4);
  const max = 5;
  return '★'.repeat(full) + '☆'.repeat(max - full);
}

// ====== Dark Mode Integration ======
const darkModeBtn = document.getElementById('dark-mode-toggle');
if (darkModeBtn) {
  darkModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
  });
}

// ====== Add to Cart ======
function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  displayCart();
  openCartSidebar();
  showToast(`${product.name} added to cart`);
}

// ====== Cart Sidebar ======
const cartSidebar = document.getElementById('cart-sidebar');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const closeCartBtn = document.getElementById('close-cart');
const placeOrderBtn = document.getElementById('place-order');

if (document.getElementById('cart')) {
  document.getElementById('cart').addEventListener('click', openCartSidebar);
}
if (closeCartBtn) closeCartBtn.addEventListener('click', () => cartSidebar.style.right = '-380px');
if (placeOrderBtn) placeOrderBtn.addEventListener('click', () => {
  const user = JSON.parse(localStorage.getItem('loggedInUser'));

  // Check if the user is logged in
  if (!user) {
    alert('⚠️ Please log in to complete your order.');
    window.location.href = 'login.html';
    return;
  }

  // Check if the cart is empty
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }

  // Successful order placement
  alert(`✅ Thank you ${user.name}! Your order has been placed successfully.`);
  cart = [];
  localStorage.removeItem('cart');
  updateCartCount();
  displayCart();
  cartSidebar.style.right = '-380px';
});


function openCartSidebar() {
  displayCart();
  cartSidebar.style.right = '0';
}

// ====== Display Cart ======
function displayCart() {
  if (!cartItemsContainer) return;
  cartItemsContainer.innerHTML = '';
  let total = 0;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
  } else {
    cart.forEach(item => {
      total += item.price * item.quantity;
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <p>${item.name}</p>
          <p>${formatKsh(item.price)} x ${item.quantity}</p>
        </div>
        <div class="cart-controls">
          <button onclick="changeQuantity(${item.id}, -1)">-</button>
          <button onclick="changeQuantity(${item.id}, 1)">+</button>
          <button onclick="removeFromCart(${item.id})">❌</button>
        </div>
      `;
      cartItemsContainer.appendChild(div);
    });
  }

  if (cartTotal) cartTotal.innerHTML = `<strong>Total:</strong> ${formatKsh(total.toFixed(2))}`;
  localStorage.setItem('cart', JSON.stringify(cart));
}

// ====== Change Quantity ======
function changeQuantity(id, change) {
  const item = cart.find(p => p.id === id);
  if (!item) return;
  item.quantity += change;
  if (item.quantity <= 0) removeFromCart(id);
  else { localStorage.setItem('cart', JSON.stringify(cart)); updateCartCount(); displayCart(); }
}

// ====== Remove from Cart ======
function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  displayCart();
}

// ====== Update Cart Count ======
function updateCartCount() {
  const count = cart.reduce((acc, item) => acc + item.quantity, 0);
  const countElement = document.getElementById('cart-count');
  if (countElement) countElement.textContent = count;
}

// ====== Product Details Modal ======
function viewDetails(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  const modal = document.getElementById('product-modal');
  const modalContent = document.getElementById('modal-content');
  modalContent.innerHTML = `
    <img src="${product.image}" alt="${product.name}" id="main-image" style="width:100%;height:220px;object-fit:cover;border-radius:8px;">
    <h2>${product.name}</h2>
    <div class="rating">${generateStars(product.rating || 4)}</div>
    <p><strong>Price:</strong> ${formatKsh(product.price)}</p>
    <p><strong>Stock:</strong> ${product.stock > 0 ? product.stock + ' available' : 'Out of stock'}</p>
    <p><strong>Description:</strong> High-quality ${product.name.toLowerCase()} curated for BestwearMall.</p>
    <div class="modal-buttons">
      <button ${product.stock === 0 ? 'disabled' : ''} onclick="addToCart(${product.id})" class="add-cart-modal">Add to Cart</button>
      <button onclick="closeModal()" id="close-modal">Close</button>
    </div>
  `;
  modal.style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.style.display = 'none';
}

// ====== Search Functionality ======
const searchInput = document.getElementById('search-input');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm));
    displayProducts(filtered);
  });
}

// ====== Toast Notifications ======
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => toast.style.display = 'none', 2500);
}

// ====== Category Filters ======
const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.filter-btn.active')?.classList.remove('active');
    btn.classList.add('active');
    const category = btn.dataset.category;
    if (category === 'all') displayProducts(products);
    else {
      const filtered = products.filter(p => p.category === category);
      displayProducts(filtered);
    }
  });
});
// ====== User Authentication Display ======
document.addEventListener('DOMContentLoaded', () => {
  const userInfo = document.getElementById('user-info');
  const user = JSON.parse(localStorage.getItem('loggedInUser'));

  if (user && userInfo) {
    userInfo.innerHTML = `
      <span style="margin-right:10px;">👋 Hi, ${user.name}</span>
      <button id="logout-btn" style="padding:5px 10px; border:none; background:#e63946; color:white; border-radius:5px; cursor:pointer;">Logout</button>
    `;

    document.getElementById('logout-btn').addEventListener('click', () => {
      localStorage.removeItem('loggedInUser');
      alert('You have logged out successfully.');
      window.location.reload();
    });
  } else if (userInfo) {
    userInfo.innerHTML = `<a href="login.html" style="color:white; text-decoration:none;">Login</a>`;
  }
});
