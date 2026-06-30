const profileBtn = document.querySelector(".profile-btn");
const profilePopup = document.querySelector(".profile-popup");
const logoutBtn = document.querySelector(".logout-btn");
const profileName = document.querySelector(".profile-txt");

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

fetchName();