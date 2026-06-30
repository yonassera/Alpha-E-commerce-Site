const itemContainer = document.querySelector(".items");
const category = document.querySelector(".category-selection");
const catText = document.querySelector(".cat-text");
const searchBox = document.querySelector(".search");
const exploreBtn = document.querySelector(".explore-btn");
const categorySection = document.getElementById("cat");
const cartPopup = document.querySelector(".cart-popup");

exploreBtn.addEventListener("click", (e) => {
  categorySection.scrollIntoView({ behavior: "smooth" });
});

function displayItems(result) {
  if (result) {
    const itemContent = result
      .map(
        (item) => `
        <div class="item" data-id="${item.id}">
            <img class="item-image" src="${item.img}" alt="Image for ${item.title}">
            <h2 class="text item-title">${item.title}</h2>
            <h2 class="text price">$${item.price}</h2>
            <button class="btn add-to-cart-btn" data-id="${item.id}">Add to cart</button>
        </div>
      `,
      )
      .join("");

    itemContainer.innerHTML = itemContent;

    itemContainer.addEventListener("click", async (e) => {
      const target = e.target.closest(".item");
      const cartBtn = e.target.matches(".add-to-cart-btn");

      if (target && !cartBtn) {
        const id = target.dataset.id;
        window.location.href = `/product?id=${id}`;
      } else if (cartBtn) {
        const itemId = e.target.dataset.id;

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
      }
    });
  }
}

async function fetchAllItems() {
  catText.textContent = "List of items";
  const response = await fetch("/api/list-all-items", {
    method: "GET",
  });
  const result = await response.json();

  if (result.success) {
    displayItems(result.data);
  }
}

category.addEventListener("click", async (e) => {
  if (e.target.classList.contains("cat-option")) {
    document.querySelectorAll(".cat-option").forEach((element) => {
      element.classList.remove("active");
    });
    e.target.classList.add("active");
    const cat = e.target.dataset.cat;
    catText.textContent = cat;

    const response = await fetch(`/api/list-by-category/${cat}`, {
      method: "GET",
    });
    const result = await response.json();
    if (result.success) {
      displayItems(result.data);
    }
  }
});

searchBox.addEventListener("input", async (e) => {
  const value = e.target.value.trim();

  document.querySelectorAll(".cat-option").forEach((element) => {
    element.classList.remove("active");
  });

  if (value == "") fetchAllItems();

  if (value) {
    catText.textContent = "Search results...";

    const response = await fetch(`/api/search-item/${value}`, {
      method: "GET",
    });
    const result = await response.json();

    if (result.success) {
      displayItems(result.data);
    }
  }
});

fetchAllItems();
