const addBtn = document.querySelector(".add-btn");
const modal = document.querySelector(".modal");
const itemFormPopup = document.querySelector(".item-form-popup");
const delItemPopup = document.querySelector(".del-item-popup");
const approveDelete = document.querySelector(".approve-delete");
const msg = document.querySelector(".msg");
const itemContainer = document.querySelector(".items");
const itemForm = document.querySelector(".item-form");
const searchBox = document.querySelector(".search");
const logoutBtn = document.querySelector(".logout-btn");
const totalProducts = document.querySelector(".total-products");
const totalSales = document.querySelector(".total-sales");
const itemFormTitle = document.querySelector(".item-form-title");
let itemId;

//Form fields
const title = document.querySelector(".title-field");
const category = document.querySelector(".category-field");
const description = document.querySelector(".desc-field");
const price = document.querySelector(".price-field");
const stock = document.querySelector(".stock-field");
const image = document.querySelector(".image-field");

logoutBtn.addEventListener("click", async (e) => {
  const response = await fetch("/logout", {
    method: "GET",
  });

  const result = await response.json();
  if (result.success) {
    window.location.href = "/login";
  }
});

async function fetchStat() {
  const response = await fetch("/api/get-product-stat", { method: "GET" });
  const result = await response.json();

  if (result.success) {
    totalProducts.textContent = result.stat.totalProduct;
    totalSales.textContent = "$" + result.stat.totalSales;
  } else {
    totalProducts.textContent = "0";
    totalSales.textContent = "$0";
  }
}

function displayItems(result) {
  if (result) {
    const itemContent = result
      .map(
        (item) => `
      <div class="item-list">
        <div class="product-row">
          <img src="${item.img}" width="60px" alt="">
          <h3 class="text">${item.title}</h3>
        </div>
        <h3 class="text category-row">${item.category}</h3>
        <h3 class="text price-row">${item.price}</h3>
        <h3 class="text stock-row">${item.stock} units</h3>
        <div class="actions-row twin-btn">
          <svg class="clickable edit-btn" data-id="${item.id}" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="blue"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120H200Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z"/></svg>
          <svg class="clickable delete-btn" data-id="${item.id}" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="red"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
        </div>
      </div>
    `,
      )
      .join("");
    itemContainer.innerHTML = itemContent;
  }

  document.querySelectorAll(".edit-btn").forEach((element) => {
    element.addEventListener("click", async (e) => {
      itemId = e.currentTarget.dataset.id;

      modal.style.display = "flex";
      modal.replaceChildren();
      modal.appendChild(itemFormPopup);

      itemFormTitle.textContent = "Edit Product";

      const response = await fetch(`/api/product/${itemId}`, {
        method: "get",
      });
      const result = await response.json();

      if (result.success) {
        const data = result.data[0];

        title.value = data.title;
        category.value = data.category;
        description.value = data.description;
        price.value = data.price;
        stock.value = data.stock;
      }
    });
  });

  document.querySelectorAll(".delete-btn").forEach((element) => {
    element.addEventListener("click", (e) => {
      itemId = e.currentTarget.dataset.id;

      modal.style.display = "flex";
      modal.replaceChildren();
      modal.appendChild(delItemPopup);
    });
  });

  approveDelete.addEventListener("click", async (e) => {
    const response = await fetch(`/api/delete-item/${itemId}`, {
      method: "post",
    });
    const result = await response.json();
    if (result.success) {
      modal.style.display = "none";
      fetchProducts();
      fetchStat();
    } 
  });
}

async function fetchProducts() {
  const response = await fetch("/api/list-all-items", {
    method: "GET",
  });
  const result = await response.json();

  if (result.success) {
    displayItems(result.data);
  } 
}

searchBox.addEventListener("input", async (e) => {
  const value = e.currentTarget.value;

  if (value == "") fetchProducts();

  if (value) {
    const response = await fetch(`/api/search-item/${value}`, {
      method: "GET",
    });
    const result = await response.json();

    if (result.success) {
      displayItems(result.data);
    }
  }
});

modal.addEventListener("click", (e) => {
  const target = e.target.classList;
  if (target.contains("close-btn") || target.contains("modal")) {
    modal.style.display = "none";
    itemForm.reset();
    msg.textContent = "";
  }
});

addBtn.addEventListener("click", (e) => {
  modal.style.display = "flex";
  modal.replaceChildren();
  itemFormTitle.textContent = "Add Product";
  modal.appendChild(itemFormPopup);
});

if (itemForm) {
  itemForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    if (itemFormTitle.textContent == "Add Product") {
      const response = await fetch("/api/upload-product", {
        method: "post",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        msg.style.color = "green";
        msg.textContent = "Successfully Added";
        setTimeout(() => {
          e.target.reset();
          modal.style.display = "none";
          msg.textContent = "";
          fetchProducts();
          fetchStat();
        }, 1000);
      } else {
        msg.style.color = "red";
        msg.textContent = "Something went wrong!";
      }
    } else {
      const response = await fetch(`/api/edit-item/${itemId}`, {
        method: "post",
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        msg.style.color = "green";
        msg.textContent = "Successfully Edited";
        setTimeout(() => {
          e.target.reset();
          modal.style.display = "none";
          msg.textContent = "";
          fetchProducts();
          fetchStat();
        }, 1000);
      } else {
        msg.style.color = "red";
        msg.textContent = "Something went wrong!";
      }
    }
  });
}

fetchStat();
fetchProducts();
