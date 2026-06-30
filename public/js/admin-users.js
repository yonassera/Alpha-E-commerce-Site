const logoutBtn = document.querySelector(".logout-btn");
const userContainer = document.querySelector(".items");
const searchBox = document.querySelector(".search");
const modal = document.querySelector(".modal");
const delPopup = document.querySelector(".delete-popup");
const suspendPopup = document.querySelector(".suspend-popup");
const unsuspendPopup = document.querySelector(".unsuspend-popup");
const approveDelete = document.querySelector(".approve-delete");
const approveSuspend = document.querySelector(".approve-suspend");
const approveUnsuspend = document.querySelector(".approve-unsuspend");
const totalCustomers = document.querySelector(".total-customers");
const totalSuspended = document.querySelector(".suspended-customers");
const totalActive = document.querySelector(".active-customers");

let userId;

async function loadStats() {
  const response = await fetch("/api/get-user-stat", { method: "GET" });
  const result = await response.json();

  if (result.success) {
    totalCustomers.textContent = result.stat.totalCustomers;
    totalSuspended.textContent = result.stat.totalSuspended;
    totalActive.textContent = result.stat.totalActive;
  }
}

logoutBtn.addEventListener("click", async (e) => {
  const response = await fetch("/logout", {
    method: "GET",
  });

  const result = await response.json();
  if (result.success) {
    window.location.href = "/login";
  }
});

modal.addEventListener("click", (e) => {
  const target = e.target.classList;
  if (target.contains("close-btn") || target.contains("modal")) {
    modal.style.display = "none";
  }
});

approveDelete.addEventListener("click", async (e) => {
  const response = await fetch(`/api/delete-user/${itemId}`, {
    method: "DELETE",
  });
  const result = await response.json();

  modal.style.display = "none";
  loadStats();
  fetchUsers();
});

approveSuspend.addEventListener("click", async (e) => {
  const response = await fetch(`/api/suspend-user/${itemId}`, {
    method: "PUT",
  });
  const result = await response.json();

  modal.style.display = "none";
  loadStats();
  fetchUsers();
});

approveUnsuspend.addEventListener("click", async (e) => {
  const response = await fetch(`/api/unsuspend-user/${itemId}`, {
    method: "PUT",
  });
  const result = await response.json();

  modal.style.display = "none";
  loadStats();
  fetchUsers();
});

function displayUsers(result) {
  if (result) {
    const users = result.data
      .map(
        (user) => `
      <div class="item-list">
        <div class="product-row">
          <h3 class="text">${user.fullname}</h3>
        </div>
        <h3 class="text category-row">${user.isSuspended ? "Suspended" : "Active"}</h3>
        <div class="actions-row twin-btn">
          ${user.isSuspended ? `<button class="btn unsuspend-btn positive-btn" data-id=${user.id}>Unsuspend</button>` : `<button class="btn suspend-btn danger-btn" data-id=${user.id}>Suspend</button>`}
          <button class="btn delete-btn danger-btn" data-id="${user.id}">Delete</button>
        </div>
      </div>
      `,
      )
      .join("");

    userContainer.innerHTML = users;

    userContainer.addEventListener("click", (e) => {
      const delBtn = e.target.closest(".delete-btn");
      const suspendBtn = e.target.closest(".suspend-btn");
      const unSuspendBtn = e.target.closest(".unsuspend-btn");
      itemId = e.target.dataset.id;

      if (delBtn) {
        modal.style.display = "flex";
        modal.replaceChildren();
        modal.appendChild(delPopup);
      } else if (suspendBtn) {
        modal.style.display = "flex";
        modal.replaceChildren();
        modal.appendChild(suspendPopup);
      } else if (unSuspendBtn) {
        modal.style.display = "flex";
        modal.replaceChildren();
        modal.appendChild(unsuspendPopup);
      }
    });
  }
}

async function fetchUsers() {
  const response = await fetch("/api/list-all-users", { method: "GET" });
  const result = await response.json();

  if (result.success) {
    displayUsers(result);
  }
}

searchBox.addEventListener("input", async (e) => {
  const value = e.currentTarget.value;
  if (value == "") fetchUsers();

  if (value) {
    const response = await fetch(`/api/search-user/${value}`, {
      method: "GET",
    });
    const result = await response.json();

    if (result.success) {
      displayUsers(result);
    }
  }
});

loadStats();
fetchUsers();
