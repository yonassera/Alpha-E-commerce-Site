const profileName = document.querySelector(".profile-txt");
const profileBtn = document.querySelector(".profile-btn");
const profilePopup = document.querySelector(".profile-popup");
const logoutBtn = document.querySelector(".logout-btn");
const cartItemContainer = document.querySelector(".cart-items");
const subTotal = document.querySelector(".price");
const checkout = document.querySelector(".checkout-btn");
const modal = document.querySelector(".modal");
let uname = null;

async function fetchName() {
  const response = await fetch("/get-user-info", {
    method: "GET",
  });

  const result = await response.json();

  if (result.success) {
    profileName.textContent = result.uname;
    uname = result.uname;
    profileBtn.addEventListener("click", (e) => {
      profilePopup.classList.toggle("active");

      window.addEventListener("click", (e) => {
        if (
          !e.target.matches(".logout-btn, .profile-btn, .avatar, .profile-txt")
        ) {
          profilePopup.classList.remove("active");
        }
      });
    });

    logoutBtn.addEventListener("click", async (e) => {
      const response = await fetch("/logout", {
        method: "GET",
      });

      const result = await response.json();
      if (result.success) {
        window.location.href = "/";
      }
    });
  } else {
    profileBtn.addEventListener("click", (e) => {
      window.location.href = "/login";
    });
  }
}

async function estimatedTotal() {
  const response = await fetch("/api/get-cart-subtotal", {
    method: "GET",
  });
  const result = await response.json();
  if (result.success && result.total > 0) {
    subTotal.textContent = "$" + result.total;
    return result.total;
  } else {
    subTotal.textContent = "$0";
    checkout.classList.add("disabled");
  }
}

checkout.addEventListener("click", async (e) => {
  if (!uname) {
    window.location.href = "/login";
  }
  const subtotal = await estimatedTotal();
  const response = await fetch(`/api/checkout/${subtotal}`, { method: "post" });
  const result = await response.json();

  if (result.success) {
    modal.style.display = "flex";
    modal.addEventListener("click", (e) => {
      const target = e.target.classList;
      if (target.contains("close-btn") || target.contains("modal")) {
        modal.style.display = "none";
      }
    });
  } else {
    console.log("Checkout failed");
  }
});

async function fetchCartItems() {
  const response = await fetch("/api/get-cart-items", { method: "GET" });
  const result = await response.json();

  if (result.success) {
    const cartItems = result.items
      .map(
        (item) => `
        <div class="cart-item-container" data-id="${item.id}">
            <div class="left-cart-info">
                <svg class="clickable del-item" data-id="${item.id}" xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px" fill="red"><path d="m376-300 104-104 104 104 56-56-104-104 104-104-56-56-104 104-104-104-56 56 104 104-104 104 56 56Zm-96 180q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520Zm-400 0v520-520Z"/></svg>
                <img class="item-img" src="${item.img}" alt="Headphone image">
                <div class="cart-item-info">
                    <h2 class="text">${item.title}</h2>
                    <p class="text">${item.category}</p>
                    <p class="text price">$${item.price}</p>
                </div>
            </div>
            <div class="right-cart-info">
                <button class="clickable minus-btn" data-id="${item.id}" ${item.quantity == 1 ? "disabled" : ""} style="padding: 5px; border-radius: 10px; border: none; margin: 10px;">-</button>
                <p class="text quantity" id="cart${item.id}">${item.quantity}</p>
                <button class="clickable plus-btn" data-id="${item.id}" ${item.stock == item.quantity ? "disabled" : ""} style="padding: 5px; border-radius: 10px; border: none; margin: 10px;">+</button>
            </div>
        </div>
    `,
      )
      .join("");
    cartItemContainer.innerHTML = cartItems;

    cartItemContainer.addEventListener("click", async (e) => {
      const minusBtn = e.target.closest(".minus-btn");
      const plusBtn = e.target.closest(".plus-btn");
      const delBtn = e.target.closest(".del-item");
      const item = e.target.closest(".cart-item-container");

      if (minusBtn) {
        const itemId = minusBtn.dataset.id;
        const quantity = document.getElementById(`cart${itemId}`);
        let q = +quantity.textContent;
        if (q != 1) q--;

        const response = await fetch(
          `/api/adjust-cart-quantity/${itemId}/${q}`,
          {
            method: "PUT",
          },
        );
        const result = await response.json();
        if (result.success) {
          quantity.textContent = q;
          estimatedTotal();
          fetchCartItems();
        }
      } else if (plusBtn) {
        const itemId = plusBtn.dataset.id;
        const quantity = document.getElementById(`cart${itemId}`);
        let q = +quantity.textContent;
        q++;
        const response = await fetch(
          `/api/adjust-cart-quantity/${itemId}/${q}`,
          {
            method: "PUT",
          },
        );
        const result = await response.json();
        if (result.success) {
          quantity.textContent = q;
          estimatedTotal();
          fetchCartItems();
        }
      } else if (delBtn) {
        const itemId = delBtn.dataset.id;

        const response = await fetch(`/api/delete-cart-element/${itemId}`, {
          method: "DELETE",
        });
        const result = await response.json();
        if (result.success) {
          window.location.href = "/carts";
        }
      } else if (
        item &&
        !e.target.matches(".del-item, .plus-btn, .minus-btn")
      ) {
        const itemId = item.dataset.id;
        window.location.href = `/product?id=${itemId}`;
      }
    });
  }
  estimatedTotal();
}

fetchName();
fetchCartItems();
