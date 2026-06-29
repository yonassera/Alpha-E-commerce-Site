const profileName = document.querySelector(".profile-txt");
const profileBtn = document.querySelector(".profile-btn");
const profilePopup = document.querySelector(".profile-popup");
const logoutBtn = document.querySelector(".logout-btn");
const container = document.querySelector(".main");
const cartPopup = document.querySelector(".cart-popup");
let itemId;

async function fetchName() {
  const response = await fetch("/get-user-info", {
    method: "GET",
  });

  const result = await response.json();

  if (result.success) {
    profileName.textContent = result.uname;
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

async function fetchProductDetail() {
  const id = new URLSearchParams(window.location.search).get("id");
  const response = await fetch(`/api/product/${id}`);
  const result = await response.json();
  itemId = id;
  if (result.success) {
    const detail = result.data[0];

    const itemContent = `
        <div class="product-img">
          <img
          src='${detail.img}'
          alt='${detail.img}'
          width="400px"
          style="border-radius: 20px"
          />
        </div>
        <div class="item-desc-container">
          <div class="item-desc">
            <p class="text product-cat">${detail.category}</p>
            <h1 class="text product-item-title">${detail.title}</h1>
            <p class="text product-desc-text">${detail.description}</p>
            <button class="btn add-to-cart-btn" data-id='${detail.id}'>Add to cart</button>
          </div>
        </div>
      `;

    container.innerHTML = itemContent;
    const cartBtn = document.querySelector(".add-to-cart-btn");

    cartBtn.addEventListener("click", async (e) => {
      const response = await fetch(`/api/add-to-cart/${itemId}`, {
        method: "POST",
      });
      const result = await response.json();

      if (result.success) {
        cartPopup.style.display = "flex";
        setTimeout(() => {
          cartPopup.style.display = "none";
        }, 600);
      }
    });
  } else {
    console.log("Couldnt fetch");
  }
}

fetchName();
fetchProductDetail();
