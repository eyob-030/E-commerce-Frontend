const formTitle = document.getElementById("formTitle");
const authForm = document.getElementById("authForm");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirmPassword");
const termsCheckbox = document.getElementById("terms");

const usernameWrapper = document.getElementById("usernameWrapper");
const confirmWrapper = document.getElementById("confirmWrapper");
const termsWrapper = document.getElementById("termsWrapper");

const messageDiv = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");
const submitText = document.getElementById("submitText");
const submitSpinner = document.getElementById("submitSpinner");
const toggleForm = document.getElementById("toggleForm");

const authButton = document.getElementById("authButton");
const authButtonText = document.getElementById("authButtonText");
const userBadge = document.getElementById("userBadge");

const API_BASE = "http://localhost:5000/api/auth/";
let isLogin = true;

function setFormMode(loginMode) {
  isLogin = loginMode;
  formTitle.textContent = isLogin ? "Login" : "Register";
  submitText.textContent = isLogin ? "Login" : "Register";

  usernameWrapper.style.display = isLogin ? "none" : "block";
  confirmWrapper.style.display = isLogin ? "none" : "block";
  termsWrapper.style.display = isLogin ? "none" : "block";

  usernameInput.required = !isLogin;
  confirmInput.required = !isLogin;
  termsCheckbox.required = !isLogin;

  toggleForm.textContent = isLogin
    ? "Don't have an account? Register"
    : "Already have an account? Login";

  authForm.reset();
  messageDiv.textContent = "";
}

toggleForm.addEventListener("click", (e) => {
  e.preventDefault();
  setFormMode(!isLogin);
});

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const username = usernameInput.value.trim();
  const confirmPassword = confirmInput.value.trim();

  submitText.textContent = isLogin ? "Logging in..." : "Registering...";
  submitSpinner.style.display = "inline-block";
  submitBtn.disabled = true;

  if (!isLogin) {
    if (password !== confirmPassword) {
      showMessage("Passwords do not match", "red");
      resetSubmitButton();
      return;
    }
    if (!termsCheckbox.checked) {
      showMessage("You must accept the terms", "red");
      resetSubmitButton();
      return;
    }
  }

  const payload = isLogin ? { email, password } : { username, email, password };

  const endpoint = isLogin ? "login" : "register";

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Request failed");
    }

    showMessage(result.message || "Success", "green");

    if (isLogin && result.data?.token) {
      localStorage.setItem("token", result.data.token);
      localStorage.setItem("user", JSON.stringify(result.data));

      updateAuthButton();

      const modal = bootstrap.Modal.getInstance(
        document.getElementById("authModal")
      );
      if (modal) modal.hide();

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } else if (!isLogin) {
      setTimeout(() => {
        setFormMode(true);
        resetSubmitButton();
      }, 1500);
    } else {
      resetSubmitButton();
    }
  } catch (err) {
    console.error("Auth error:", err);
    showMessage(err.message || "Login failed", "red");
    resetSubmitButton();
  }
});

function resetSubmitButton() {
  submitText.textContent = isLogin ? "Login" : "Register";
  submitSpinner.style.display = "none";
  submitBtn.disabled = false;
}

function showMessage(msg, color) {
  messageDiv.textContent = msg;
  messageDiv.style.color = color;
  setTimeout(() => {
    if (messageDiv.textContent === msg) {
      messageDiv.textContent = "";
    }
  }, 3000);
}

function updateAuthButton() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (token && user) {
    authButtonText.textContent = user.username || "User";
    authButton.classList.remove("btn-outline-warning");
    authButton.classList.add("btn-warning", "text-dark");
    userBadge.classList.remove("d-none");

    authButton.setAttribute("data-bs-toggle", "");
    authButton.setAttribute("data-bs-target", "");
    authButton.onclick = handleLogout;
  } else {
    authButtonText.textContent = "Login";
    authButton.classList.add("btn-outline-warning");
    authButton.classList.remove("btn-warning", "text-dark");
    userBadge.classList.add("d-none");

    authButton.setAttribute("data-bs-toggle", "modal");
    authButton.setAttribute("data-bs-target", "#authModal");
    authButton.onclick = null;
  }
}

function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    updateAuthButton();
    window.location.href = "index.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setFormMode(true);
  updateAuthButton();
});
