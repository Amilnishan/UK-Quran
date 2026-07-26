import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { auth, database } from "./firebase-config.js";

// DOM Elements
const toastContainer = document.getElementById('toast-container');
const landingContent = document.getElementById("landing-content");
const loginForm = document.getElementById("login-form");
const loginFooter = document.getElementById("login-footer");

const btnShowLogin = document.getElementById("btn-show-login");
const btnGuestLogin = document.getElementById("btn-guest-login");
const btnBackToLanding = document.getElementById("btn-back-to-landing");

const inputId = document.getElementById('input-id');
const inputPassword = document.getElementById('input-password');

// Handle Account Removed Error
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('error') === 'account_removed') {
    showToast("This account no longer exists. Please contact your teacher.", "error");
    window.history.replaceState({}, document.title, window.location.pathname);
}

function showToast(message, type = 'error') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 2600);
}

function toAuthPassword(pin) {
    return String(pin).padEnd(6, '0');
}

// Landing Navigation
btnShowLogin.addEventListener("click", () => {
    landingContent.classList.add("hidden");
    loginForm.classList.remove("hidden");
    loginFooter.classList.remove("hidden");
});

btnBackToLanding.addEventListener("click", () => {
    loginForm.classList.add("hidden");
    loginFooter.classList.add("hidden");
    landingContent.classList.remove("hidden");
});

// Guest Access Handler
btnGuestLogin.addEventListener("click", () => {
    sessionStorage.setItem("isGuest", "true");
    window.location.href = "Components/Guest/guest.html";
});

// Password Visibility Toggle
const togglePassword = document.getElementById('togglePassword');
if (togglePassword) {
    togglePassword.addEventListener('click', function () {
        const isHidden = inputPassword.getAttribute('type') === 'password';
        inputPassword.setAttribute('type', isHidden ? 'text' : 'password');
        togglePassword.classList.toggle('is-visible', isHidden);
        togglePassword.setAttribute('aria-pressed', String(isHidden));
        togglePassword.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    });
}

// Unified Form Submission (Auto-detects Teacher vs Student)
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userInput = inputId.value.trim();
    const userPass = inputPassword.value.trim();
    const submitBtn = document.getElementById('btn');

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loader-inline1" aria-hidden="true"></span>';

    // If user input contains '@', treat as Teacher Email. Otherwise, treat as Student ID.
    const isTeacher = userInput.includes('@');

    if (isTeacher) {
    signInWithEmailAndPassword(auth, userInput, userPass)
        .then((userCredential) => {
            if (userInput.toLowerCase() === 'teacher@uk-quran.com') {
                window.location.href = "Components/Admin/admin.html";
            } else {
                window.location.href = "Components/Teacher/teacher.html";
            }
        })
        .catch(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "Login ➔";
            showToast("Login Failed: Invalid Credentials", "error");
        });
    } else {
        const studentEmail = `${userInput.toLowerCase()}@student.ukquran.com`;
        const authPassword = toAuthPassword(userPass);

        try {
            await signInWithEmailAndPassword(auth, studentEmail, authPassword);

            const studentId = userInput.toLowerCase();
            const teachersSnap = await get(ref(database, 'teachers'));
            let stillExists = false;

            if (teachersSnap.exists()) {
                teachersSnap.forEach((teacherSnap) => {
                    const students = teacherSnap.child('students').val();
                    if (students && students[studentId]) stillExists = true;
                });
            }

            if (stillExists) {
                window.location.href = "Components/Student/student.html";
            } else {
                await signOut(auth);
                submitBtn.disabled = false;
                submitBtn.innerHTML = "Login ➔";
                showToast("This account no longer exists. Please contact your teacher.", "error");
            }
        } catch (error) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "Login ➔";
            showToast("Invalid Student ID or PIN.", "error");
        }
    }
});

// PWA Installation Prompt Logic
const a2hsPrompt = document.getElementById('a2hs-prompt');
const btnAddHome = document.getElementById('btn-add-home');
const btnDismissA2HS = document.getElementById('btn-dismiss-a2hs');
const iosA2HSTip = document.getElementById('ios-a2hs-tip');
let deferredPrompt = null;

function isIos() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isInStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function shouldShowPrompt() {
    return !localStorage.getItem('ukquran_a2hs_added') && !localStorage.getItem('ukquran_a2hs_dismissed');
}

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    if (shouldShowPrompt() && a2hsPrompt) {
        a2hsPrompt.classList.remove('hidden');
        if (iosA2HSTip) iosA2HSTip.classList.add('hidden');
    }
});

if (btnAddHome) {
    btnAddHome.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
            localStorage.setItem('ukquran_a2hs_added', 'true');
        } else {
            localStorage.setItem('ukquran_a2hs_dismissed', 'true');
        }
        if (a2hsPrompt) a2hsPrompt.classList.add('hidden');
        deferredPrompt = null;
    });
}

if (btnDismissA2HS) {
    btnDismissA2HS.addEventListener('click', () => {
        localStorage.setItem('ukquran_a2hs_dismissed', 'true');
        if (a2hsPrompt) a2hsPrompt.classList.add('hidden');
    });
}

window.addEventListener('load', () => {
    if (isIos() && !isInStandaloneMode() && shouldShowPrompt() && a2hsPrompt) {
        a2hsPrompt.classList.remove('hidden');
        if (iosA2HSTip) iosA2HSTip.classList.remove('hidden');
    }
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/JavaScript/sw.js').catch(() => {});
    }
});