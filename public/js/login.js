const loginForm = document.querySelector(".login-form");
const msgText = document.querySelector(".msg");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);

  const response = await fetch("/api/login", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (result.success) {
    window.location.href = result.redirectUrl;
    loginForm.reset();
  } else {
    msgText.style.color = "red";
    msgText.textContent = result.message;
  }
});
