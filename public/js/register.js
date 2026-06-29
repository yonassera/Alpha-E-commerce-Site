const regForm = document.querySelector(".reg-form");
const msgText = document.querySelector(".msg");

regForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const password = formData.get("password");
  const confirmPassword = formData.get("confirm-password");

  if (password !== confirmPassword) {
    msgText.style.color = "red";
    msgText.textContent = "Confirm password doesn't match.";
    return;
  }

  const response = await fetch("/api/register-user", {
    method: "post",
    body: formData,
  });

  const result = await response.json();

  if (result.success) {
    msgText.style.color = "green";
    msgText.textContent = result.message;
    regForm.reset();

    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
  } else {
    console.log("Registration failed");
    msgText.style.color = "red";
    msgText.textContent = result.message;
  }
});
