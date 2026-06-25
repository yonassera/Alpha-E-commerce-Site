const itemContainer = document.querySelector(".items");
const category = document.querySelector(".category-selection");
const catText = document.querySelector(".cat-text");
const searchBox = document.querySelector(".search");
const exploreBtn = document.querySelector(".explore-btn");
const categorySection = document.getElementById("cat");

exploreBtn.addEventListener("click", (e) => {
  categorySection.scrollIntoView({ behavior: "smooth" });
});

function displayItems(result) {
  const itemContent = result
    .map(
      (item) => `
        <div class="item" data-id="${item.id}">
            <img class="item-image" src="${item.img}" alt="Image for ${item.title}">
            <h2 class="text item-title">${item.title}</h2>
            <h2 class="text price">$${item.price}</h2>
            <button class="btn item-btn" data-id="${item.id}">Add to cart</button>
        </div>
      `,
    )
    .join("");

  itemContainer.innerHTML = itemContent;

  itemContainer.addEventListener("click", (e) => {
    const target = e.target.closest(".item");

    if (target) {
      const id = target.dataset.id;
      window.location.href = `/product.html?id=${id}`;
    }
  });
}

async function fetchAllItems() {
  catText.textContent = "List of items";
  const response = await fetch("/api/list-all-items", {
    method: "GET",
  });

  if (response.headers.get("content-type").includes("application/json")) {
    const result = await response.json();
    displayItems(result);
  } else {
    console.log("error while fetching");
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

    if (
      response &&
      response.headers.get("content-type").includes("application/json")
    ) {
      const result = await response.json();
      displayItems(result);
    } else {
      console.log("error while fetching");
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

    if (response.headers.get("content-type").includes("application/json")) {
      const result = await response.json();
      displayItems(result);
    } else {
      console.log("error while fetching");
    }
  }
});

fetchAllItems();
