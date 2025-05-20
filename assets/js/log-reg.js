const formTitle = document.getElementById("formTitle");
const authForm = document.getElementById("authForm");
const usernameInput = document.getElementById("username");
const usernameWrapper = document.getElementById("usernameWrapper");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmWrapper = document.getElementById("confirmWrapper");
const termsWrapper = document.getElementById("termsWrapper");
const submitBtn = document.getElementById("submitBtn");
const messageDiv = document.getElementById("message");
let isLogin = true;

const API = "http://localhost:5000/api/auth";

function setFormMode(loginMode) {
  isLogin = loginMode;
  formTitle.textContent = isLogin ? "Login" : "Register";
  submitBtn.textContent = isLogin ? "Login" : "Register";
  usernameWrapper.style.display = isLogin ? "none" : "block";
  confirmWrapper.style.display = isLogin ? "none" : "block";
  termsWrapper.style.display = isLogin ? "none" : "block";
}

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = emailInput.value;
  const password = passwordInput.value;
  const username = usernameInput.value;

  const endpoint = isLogin ? "/login" : "/register";
  const payload = isLogin ? { email, password } : { username, email, password };

  try {
    const res = await fetch(API + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.status === 409) {
      showMessage(data.message || "User already exists", "red");
      return;
    }

    if (data.success) {
      showMessage(data.message, "green");
    } else {
      showMessage(data.message || "Something went wrong", "red");
    }
  } catch (err) {
    showMessage("Server error", "red");
  }
});

function showMessage(msg, color) {
  messageDiv.textContent = msg;
  messageDiv.style.color = color;
}

// Initialize in login mode
setFormMode(true);
