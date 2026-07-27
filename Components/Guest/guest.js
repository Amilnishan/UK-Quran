const donationUpi = 'abutaubha123-3@okaxis';

// UI Elements
const toastContainer = document.getElementById('toast-container');
const donateModal = document.getElementById('modal-donate');
const donateButtons = document.querySelectorAll('.btn-open-donate');
const btnCloseDonate = document.getElementById('btn-close-donate');
const btnCopyUpi = document.getElementById('btn-copy-upi');
const btnQrPay = document.getElementById('btn-qr-pay');
const btnQrShare = document.getElementById('btn-qr-share');
const donationQrImage = document.getElementById('donation-qr-image');

const btnOpenThajweed = document.getElementById('btn-open-thajweed');
const btnOpenQiraat = document.getElementById('btn-open-qiraat');

const btnMenu = document.getElementById('btn-menu');
const guestMenuBackdrop = document.getElementById('guest-menu-backdrop');
const guestSideMenu = document.getElementById('guest-side-menu');
const btnMenuClose = document.getElementById('btn-menu-close');
const btnMenuHome = document.getElementById('btn-menu-home');
const btnMenuThajweed = document.getElementById('btn-menu-thajweed');
const btnMenuQiraat = document.getElementById('btn-menu-qiraat');
const btnMenuLogout = document.getElementById('btn-menu-logout');

function showToast(message, type = 'success') {
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

// Mark session as guest
sessionStorage.setItem('isGuest', 'true');

// Section Navigation
if (btnOpenThajweed) {
    btnOpenThajweed.addEventListener('click', () => {
        window.location.href = '../Thajweed/thajweed.html';
    });
}

if (btnOpenQiraat) {
    btnOpenQiraat.addEventListener('click', () => {
        window.location.href = '../Qira\'at/qiraat.html';
    });
}

// Donate Modal Handling (Triggers from both Header button and Side menu button)
if (donateButtons) {
    donateButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            if (donateModal) donateModal.classList.remove('hidden');
            closeMenu();
        });
    });
}

if (btnCloseDonate) {
    btnCloseDonate.addEventListener('click', () => {
        if (donateModal) donateModal.classList.add('hidden');
    });
}

if (btnCopyUpi) {
    btnCopyUpi.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(donationUpi);
            showToast('UPI ID copied');
        } catch (error) {
            showToast('Copy failed. Please copy manually.', 'error');
        }
    });
}

if (btnQrPay) {
    btnQrPay.addEventListener('click', () => {
        const upiLink = `upi://pay?pa=${encodeURIComponent(donationUpi)}&pn=${encodeURIComponent('UK Quran')}&tn=${encodeURIComponent('Donation for UK Quran')}&cu=INR`;
        window.location.href = upiLink;
    });
}

if (btnQrShare) {
    btnQrShare.addEventListener('click', async () => {
        try {
            if (!donationQrImage) throw new Error('QR image not found');
            const res = await fetch(donationQrImage.src);
            const blob = await res.blob();
            const file = new File([blob], 'qr-code.png', { type: blob.type });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ 
                    files: [file], 
                    title: 'UK Quran Donation', 
                    text: `Donate to UK Quran Program\nUPI: ${donationUpi}` 
                });
                showToast('Sharing dialog opened');
            } else {
                await navigator.clipboard.writeText(donationUpi);
                showToast('UPI copied instead');
            }
        } catch (err) {
            if (err.name !== 'AbortError') showToast('Share failed', 'error');
        }
    });
}

if (donateModal) {
    donateModal.addEventListener('click', (e) => {
        if (e.target === donateModal) donateModal.classList.add('hidden');
    });
}

// Side Menu Logic
const openMenu = () => {
    guestSideMenu.classList.add('open');
    guestMenuBackdrop.classList.add('open');
    guestSideMenu.setAttribute('aria-hidden', 'false');
};

const closeMenu = () => {
    guestSideMenu.classList.remove('open');
    guestMenuBackdrop.classList.remove('open');
    guestSideMenu.setAttribute('aria-hidden', 'true');
};

btnMenu?.addEventListener('click', openMenu);
btnMenuClose?.addEventListener('click', closeMenu);
guestMenuBackdrop?.addEventListener('click', closeMenu);

btnMenuHome?.addEventListener('click', () => {
    closeMenu();
    window.location.href = 'guest.html';
});

btnMenuThajweed?.addEventListener('click', () => {
    closeMenu();
    window.location.href = '../Thajweed/thajweed.html';
});

btnMenuQiraat?.addEventListener('click', () => {
    closeMenu();
    window.location.href = '../Qira\'at/qiraat.html';
});

btnMenuLogout?.addEventListener('click', () => {
    closeMenu();
    sessionStorage.removeItem('isGuest');
    window.location.href = '../../index.html';
});