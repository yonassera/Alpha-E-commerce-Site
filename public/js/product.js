const container = document.querySelector(".main");

async function fetchProductDetail() {
  const id = new URLSearchParams(window.location.search).get("id");
  const response = await fetch(`/api/product/${id}`);

  if (response.headers.get("content-type").includes("application/json")) {
    const detail = (await response.json())[0];

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
            <button class="btn item-btn" data-id='${detail.id}'>Add to cart</button>
          </div>
        </div>
      `;

    container.innerHTML = itemContent;
  } else {
    console.log("Couldnt fetch");
  }
}

fetchProductDetail();
