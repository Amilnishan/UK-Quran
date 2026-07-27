import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signOut as secondarySignOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, get, set, remove, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { auth, database, secondaryAuth } from "../../JavaScript/firebase-config.js";

let currentTeacherUid = null;
let students = [];
let pendingDeleteId = null;
let searchTerm = '';
const todayStr = new Date().toISOString().split('T')[0];

// Pre-cached Quran Page Options (0-604) for 100x Faster Card Rendering
const PRECACHED_OPTIONS_TEMPLATE = Array.from({ length: 605 }, (_, i) => `<option value="${i}">${i}</option>`).join('');

function buildNumberSelectOptions(selectedValue = 0) {
    const val = String(Math.max(0, Math.min(604, Number(selectedValue) || 0)));
    return PRECACHED_OPTIONS_TEMPLATE.replace(`value="${val}"`, `value="${val}" selected`);
}

// --- DOM Refs ---
const studentListContainer = document.getElementById('student-list');
const studentSearchInput = document.getElementById('student-search');
const totalStudentsEl = document.getElementById('total-students');
const presentStudentsEl = document.getElementById('present-students');
const toastContainer = document.getElementById('toast-container');

const btnMarkAll = document.getElementById('btn-mark-all');
const btnMenu = document.getElementById('btn-menu');
const teacherMenuBackdrop = document.getElementById('teacher-menu-backdrop');
const teacherSideMenu = document.getElementById('teacher-side-menu');
const btnMenuClose = document.getElementById('btn-menu-close');
const btnMenuHome = document.getElementById('btn-menu-home');
const btnMenuCertGenerator = document.getElementById('btn-menu-cert-generator');
const btnMenuUpload = document.getElementById('btn-menu-upload');
const btnMenuReport = document.getElementById('btn-menu-report');
const btnMenuLogout = document.getElementById('btn-menu-logout');
const btnSaveReport = document.getElementById('btn-save-report');
const btnSaveLabel = document.getElementById('btn-save-label');
const btnViewReports = document.getElementById('btn-view-reports');

// Modals
const studentProgressModal = document.getElementById('student-progress-modal');
const progressModalTitle = document.getElementById('progress-modal-title');
const progressModalTableBody = document.getElementById('progress-modal-table-body');
const progressFilterMonth = document.getElementById('progress-filter-month');
const progressFilterYear = document.getElementById('progress-filter-year');
const btnCloseProgressModal = document.getElementById('btn-close-progress');
const btnToggleProgressEdit = document.getElementById('btn-toggle-progress-edit');

const progressDateEditModal = document.getElementById('progress-date-edit-modal');
const progressEditModalTitle = document.getElementById('progress-edit-modal-title');
const progressEditDateLabel = document.getElementById('progress-edit-date-label');
const progressEditNew = document.getElementById('progress-edit-new');
const progressEditRev = document.getElementById('progress-edit-rev');
const progressEditPresentBtn = document.getElementById('progress-edit-present');
const progressEditAbsentBtn = document.getElementById('progress-edit-absent');
const progressEditRemarks = document.getElementById('progress-edit-remarks');
const progressEditHeardBy = document.getElementById('progress-edit-heard-by');
const btnSaveProgressEdit = document.getElementById('btn-save-progress-edit');
const btnCancelProgressEdit = document.getElementById('btn-cancel-progress-edit');
const btnCloseProgressEditModal = document.getElementById('btn-close-progress-edit');

let currentProgressStudentId = null;
let currentProgressLogSnapshot = {};
let currentProgressEditDateKey = null;
let isProgressEditMode = false;
let isProgressEditPresent = false;

const btnAddStudent = document.getElementById('btn-add-student');
const addStudentModal = document.getElementById('add-student-modal');
const btnCancelAdd = document.getElementById('btn-cancel-add');
const addStudentForm = document.getElementById('add-student-form');
const newStudentNameInput = document.getElementById('new-student-name');
const newStudentNameHint = document.getElementById('new-student-name-hint');
const newStudentIdInput = document.getElementById('new-student-id');
const newStudentPinInput = document.getElementById('new-student-pin');
const newStudentPinHint = document.getElementById('new-student-pin-hint');

const deleteStudentModal = document.getElementById('delete-student-modal');
const deleteStudentNameEl = document.getElementById('delete-student-name');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');

// 1. Setup Header Date
const currentDateEl = document.getElementById('current-date');
if (currentDateEl) {
    currentDateEl.innerText = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// 2. Auth State Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentTeacherUid = user.uid;
        showLoadingIndicators();
        loadDataFromDB();
    } else {
        window.location.href = '../../index.html';
    }
});

// 3. Load Data from Firebase Realtime DB
function loadDataFromDB() {
    if (!currentTeacherUid) return;

    const studentsRef = ref(database, `teachers/${currentTeacherUid}/students`);
    const todayLogRef = ref(database, `teachers/${currentTeacherUid}/logs/${todayStr}`);

    Promise.all([get(studentsRef), get(todayLogRef)]).then(([snapshot, logSnap]) => {
        let loadedStudents = [];
        
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const val = child.val();
                loadedStudents.push({
                    id: child.key,
                    name: val.name || 'Student',
                    pin: val.pin || '0000',
                    isPresent: false,
                    newPages: 0,
                    rev: 0,
                    remarks: "",
                    revHeardBy: "",
                    expanded: false
                });
            });
        }

        if (logSnap.exists()) {
            const logData = logSnap.val();
            loadedStudents = loadedStudents.map(st => {
                const todaysLog = logData[st.id] || {};
                return {
                    ...st,
                    isPresent: todaysLog.isPresent === true,
                    newPages: Number(todaysLog.newPages) || 0,
                    rev: Number(todaysLog.rev) || 0,
                    remarks: String(todaysLog.remarks || ''),
                    revHeardBy: String(todaysLog.revHeardBy || '')
                };
            });
        }

        students = loadedStudents;
        renderStudents();
        hideLoadingIndicators();
    }).catch((err) => {
        console.error("Error loading student data:", err);
        showToast("Error loading student data", "error");
        hideLoadingIndicators();
    });
}

function showLoadingIndicators() {
    if (totalStudentsEl) totalStudentsEl.innerHTML = '<span class="loader-inline1"></span>';
    if (presentStudentsEl) presentStudentsEl.innerHTML = '<span class="loader-inline1"></span>';
    if (studentListContainer) studentListContainer.innerHTML = '<div class="loader-block"><div class="loader-inline1"></div><div>Loading students...</div></div>';
}

function hideLoadingIndicators() {
    if (!students.length) {
        if (totalStudentsEl) totalStudentsEl.innerText = '0';
        if (presentStudentsEl) presentStudentsEl.innerText = '0';
    }
}

// Toast Helper
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

function toAuthPassword(pin) {
    return String(pin).padEnd(6, '0');
}

const userIconSVG = `
<svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="white"/>
</svg>`;

const trashIconSVG = `
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
    <path d="M10 11v6"></path><path d="M14 11v6"></path>
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
</svg>`;

function getFilteredStudents() {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return students;
    return students.filter((student) => student.name.toLowerCase().includes(term));
}

function formatProgressDateLabel(dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function lockBodyScroll() { document.body.classList.add('modal-open'); }
function unlockBodyScroll() {
    if (!document.querySelector('.modal-overlay:not(.hidden)')) {
        document.body.classList.remove('modal-open');
    }
}

function pushModalState() {
    if (!history.state || !history.state.modalOpen) {
        history.pushState({ modalOpen: true }, '');
    }
}

// Render Student Cards
function renderStudents() {
    if (!studentListContainer) return;
    const fragment = document.createDocumentFragment();
    const visibleStudents = getFilteredStudents();

    if (!visibleStudents.length) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `<p>No student found matching “${searchTerm.trim()}”.</p>`;
        studentListContainer.innerHTML = '';
        studentListContainer.appendChild(emptyState);
        if (totalStudentsEl) totalStudentsEl.innerText = students.length;
        if (presentStudentsEl) presentStudentsEl.innerText = students.filter((s) => s.isPresent).length;
        return;
    }

    visibleStudents.forEach((student) => {
        const card = document.createElement('div');
        card.className = `student-card ${student.isPresent ? '' : 'absent'}${student.expanded ? ' expanded' : ''}`;

        card.innerHTML = `
            <div class="sc-top" data-action="toggle-card" data-student-id="${student.id}">
                <div class="sc-info">
                    <div class="av">${userIconSVG}</div>
                    <div>
                        <h4>${student.name}</h4>
                        <p class="student-meta">ID: ${student.id} | PIN: ${student.pin}</p>
                    </div>
                </div>
                <div class="sc-actions">
                    <div class="toggle-p-a">
                        <button type="button" class="${student.isPresent ? 'active-p' : ''}" data-action="present" data-student-id="${student.id}">P</button>
                        <button type="button" class="${!student.isPresent ? 'active-a' : ''}" data-action="absent" data-student-id="${student.id}">A</button>
                    </div>
                    <button type="button" class="icon-btn-delete" data-action="delete" data-student-id="${student.id}" title="Remove student">
                        ${trashIconSVG}
                    </button>
                </div>
            </div>
            <div class="sc-bottom">
                <div class="progress-row">
                    <div class="progress-item">
                        <span>New Pages</span>
                        <select class="page-select" data-action="new-pages" data-student-id="${student.id}" aria-label="New pages for ${student.name}">
                            ${buildNumberSelectOptions(student.newPages || 0)}
                        </select>
                    </div>
                    <div class="progress-item">
                        <span>Revision Pages</span>
                        <select class="page-select" data-action="rev-pages" data-student-id="${student.id}" aria-label="Revision pages for ${student.name}">
                            ${buildNumberSelectOptions(student.rev || 0)}
                        </select>
                    </div>
                </div>
                <div>
                    <label for="heard-by-${student.id}">Revision heard by</label>
                    <input type="text" id="heard-by-${student.id}" class="remark-input" value="${student.revHeardBy || ''}" data-action="heardby" data-student-id="${student.id}" placeholder="Enter name">
                </div>
                <div>
                    <label for="remark-${student.id}">Remarks</label>
                    <input type="text" id="remark-${student.id}" class="remark-input" placeholder="Remarks..." value="${student.remarks || ''}" data-action="remark" data-student-id="${student.id}">
                </div>
                <button type="button" class="btn-outline btn-monthly-progress full-width" data-action="monthly-progress" data-student-id="${student.id}">View Monthly Progress</button>
            </div>
        `;
        fragment.appendChild(card);
    });

    studentListContainer.innerHTML = '';
    studentListContainer.appendChild(fragment);

    if (totalStudentsEl) totalStudentsEl.innerText = students.length;
    if (presentStudentsEl) presentStudentsEl.innerText = students.filter((student) => student.isPresent).length;
}

// Search Listener
if (studentSearchInput) {
    studentSearchInput.addEventListener('input', (event) => {
        searchTerm = event.target.value;
        renderStudents();
    });
}

// Event Delegation for Student Cards
studentListContainer.addEventListener('click', (e) => {
    const actionTarget = e.target.closest('[data-action]');
    if (!actionTarget) return;

    const action = actionTarget.dataset.action;
    const studentId = actionTarget.dataset.studentId;
    const student = students.find((item) => item.id === studentId);

    if (!student) return;

    if (action === 'present') {
        student.isPresent = true;
        renderStudents();
    } else if (action === 'absent') {
        student.isPresent = false;
        renderStudents();
    } else if (action === 'toggle-card') {
        // Prevent card toggle if clicking P/A toggle or Delete button
        if (e.target.closest('.sc-actions')) return;
        student.expanded = !student.expanded;
        renderStudents();
    } else if (action === 'delete') {
        openDeleteModal(studentId);
    } else if (action === 'monthly-progress') {
        openStudentProgressModal(studentId);
    }
});

studentListContainer.addEventListener('change', (e) => {
    const selectEl = e.target.closest('[data-action="new-pages"]');
    if (selectEl) {
        const student = students.find((item) => item.id === selectEl.dataset.studentId);
        if (student) student.newPages = Math.max(0, Math.min(604, Number(selectEl.value) || 0));
        return;
    }

    const revSelectEl = e.target.closest('[data-action="rev-pages"]');
    if (revSelectEl) {
        const student = students.find((item) => item.id === revSelectEl.dataset.studentId);
        if (student) student.rev = Math.max(0, Math.min(604, Number(revSelectEl.value) || 0));
    }
});

studentListContainer.addEventListener('input', (e) => {
    const input = e.target.closest('[data-action="heardby"]');
    if (input) {
        const student = students.find((item) => item.id === input.dataset.studentId);
        if (student) student.revHeardBy = input.value;
        return;
    }

    const remarkInput = e.target.closest('[data-action="remark"]');
    if (remarkInput) {
        const student = students.find((item) => item.id === remarkInput.dataset.studentId);
        if (student) student.remarks = remarkInput.value;
    }
});

// --- Monthly Progress Modal ---
function openStudentProgressModal(studentId) {
    const student = students.find((item) => item.id === studentId);
    if (!student || !studentProgressModal) return;
    currentProgressStudentId = studentId;
    progressModalTitle.innerText = `Monthly Progress - ${student.name}`;
    const today = new Date();
    if (progressFilterMonth) progressFilterMonth.value = String(today.getMonth() + 1).padStart(2, '0');
    if (progressFilterYear) progressFilterYear.value = String(today.getFullYear());
    
    studentProgressModal.classList.remove('hidden');
    lockBodyScroll();
    pushModalState();
    loadStudentProgressReport(studentId);
}

function closeStudentProgressModal() {
    if (!studentProgressModal) return;
    studentProgressModal.classList.add('hidden');
    currentProgressStudentId = null;
    isProgressEditMode = false;
    if (btnToggleProgressEdit) {
        btnToggleProgressEdit.innerText = 'Edit';
        btnToggleProgressEdit.classList.remove('active-p');
    }
    closeProgressEditModal();
    unlockBodyScroll();
}

function loadStudentProgressReport(studentId) {
    if (!studentProgressModal || !progressModalTableBody || !progressFilterMonth || !progressFilterYear) return;
    const month = progressFilterMonth.value;
    const year = progressFilterYear.value;
    const prefix = `${year}-${month}`;
    progressModalTableBody.innerHTML = '<tr><td colspan="7" style="padding:16px; color:#888;">Loading monthly data...</td></tr>';

    get(ref(database, `teachers/${currentTeacherUid}/logs`)).then((snap) => {
        const rows = [];
        if (snap.exists()) {
            currentProgressLogSnapshot = snap.val();
            Object.keys(currentProgressLogSnapshot)
                .filter(dateKey => dateKey.startsWith(prefix))
                .sort((a, b) => b.localeCompare(a))
                .forEach((dateKey) => {
                    const entry = currentProgressLogSnapshot[dateKey]?.[studentId];
                    if (entry) {
                        rows.push({
                            date: dateKey,
                            newPages: entry.newPages || 0,
                            rev: entry.rev || 0,
                            present: entry.isPresent ? 1 : 0,
                            absent: entry.isPresent ? 0 : 1,
                            remarks: entry.remarks || '',
                            heardBy: entry.revHeardBy || ''
                        });
                    }
                });
        } else {
            currentProgressLogSnapshot = {};
        }

        if (rows.length === 0) {
            progressModalTableBody.innerHTML = '<tr><td colspan="7" style="padding:16px; color:#888;">No data found for this month.</td></tr>';
            return;
        }

        progressModalTableBody.innerHTML = '';
        rows.forEach((row) => {
            const [yearStr, monthStr, dayStr] = row.date.split('-');
            const dateObj = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
            const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            const editButtonMarkup = isProgressEditMode
                ? `<button type="button" class="icon-btn" data-action="edit-progress-row" data-date="${row.date}" title="Edit ${formattedDate}" style="padding:4px 7px; font-size:11px; background:#eef2ff; color:#1d4ed8;">✎</button>`
                : '';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="sticky-col" style="font-size:11px;">
                    <div style="display:flex; align-items:center; gap:6px;">
                        ${editButtonMarkup}
                        <span>${formattedDate}</span>
                    </div>
                </td>
                <td>${row.newPages || ''}</td>
                <td>${row.rev || ''}</td>
                <td style="color:#137333; font-weight:bold;">${row.present}</td>
                <td style="color:#b71c1c; font-weight:bold; background:#ffebee;">${row.absent}</td>
                <td style="font-size:11px;">${row.remarks}</td>
                <td style="font-size:11px;">${row.heardBy}</td>
            `;
            progressModalTableBody.appendChild(tr);
        });
    }).catch((err) => {
        console.error(err);
        progressModalTableBody.innerHTML = '<tr><td colspan="7" style="padding:16px; color:#888;">Unable to load monthly data.</td></tr>';
    });
}

if (btnCloseProgressModal) {
    btnCloseProgressModal.addEventListener('click', () => {
        if (history.state && history.state.modalOpen) {
            history.back();
        } else {
            closeStudentProgressModal();
        }
    });
}

// Side Menu Navigation
if (btnMarkAll) btnMarkAll.addEventListener('click', () => { students.forEach(s => s.isPresent = true); renderStudents(); });

if (btnMenu && teacherMenuBackdrop && teacherSideMenu) {
    const closeTeacherMenu = () => {
        teacherSideMenu.classList.remove('open');
        teacherMenuBackdrop.classList.remove('open');
        teacherSideMenu.setAttribute('aria-hidden', 'true');
    };
    const openTeacherMenu = () => {
        teacherSideMenu.classList.add('open');
        teacherMenuBackdrop.classList.add('open');
        teacherSideMenu.setAttribute('aria-hidden', 'false');
    };
    btnMenu.addEventListener('click', (e) => { e.stopPropagation(); openTeacherMenu(); });
    btnMenuClose?.addEventListener('click', closeTeacherMenu);
    teacherMenuBackdrop?.addEventListener('click', closeTeacherMenu);
}

if (btnMenuHome) btnMenuHome.addEventListener('click', () => window.location.href = 'teacher.html');
if (btnMenuCertGenerator) btnMenuCertGenerator.addEventListener('click', () => window.location.href = '../Certificate-Generator/certificategenerator.html');
if (btnMenuUpload) btnMenuUpload.addEventListener('click', () => window.location.href = '../Upload/upload.html');
if (btnMenuReport) btnMenuReport.addEventListener('click', () => window.location.href = '../Report/reports.html');
if (btnMenuLogout) btnMenuLogout.addEventListener('click', () => signOut(auth).then(() => window.location.href = '../../index.html'));
if (btnViewReports) btnViewReports.addEventListener('click', () => window.location.href = '../Report/reports.html');

// Reset Add Student Form
function resetAddForm() {
    if (addStudentForm) addStudentForm.reset();
    if (newStudentNameInput) newStudentNameInput.classList.remove('input-error');
    if (newStudentPinInput) newStudentPinInput.classList.remove('input-error');
    if (newStudentNameHint) {
        newStudentNameHint.textContent = 'Name must be at least 3 characters.';
        newStudentNameHint.className = 'field-hint';
    }
    if (newStudentPinHint) {
        newStudentPinHint.textContent = 'PIN must be at least 4 digits.';
        newStudentPinHint.className = 'field-hint';
    }
}

// Live Validation Listeners for Teacher Modal
if (newStudentNameInput) {
    newStudentNameInput.addEventListener('input', () => {
        const val = newStudentNameInput.value.trim();
        const isValid = val.length >= 3;
        newStudentNameInput.classList.toggle('input-error', !isValid && val.length > 0);
        if (newStudentNameHint) {
            newStudentNameHint.textContent = isValid ? 'Name looks good.' : 'Name must be at least 3 characters.';
            newStudentNameHint.className = `field-hint ${isValid ? 'valid' : 'error'}`;
        }
    });
}

if (newStudentPinInput) {
    newStudentPinInput.addEventListener('input', () => {
        const val = newStudentPinInput.value.trim();
        const isValid = /^\d{4,}$/.test(val);
        newStudentPinInput.classList.toggle('input-error', !isValid && val.length > 0);
        if (newStudentPinHint) {
            newStudentPinHint.textContent = isValid ? 'PIN looks good.' : 'PIN must be at least 4 digits.';
            newStudentPinHint.className = `field-hint ${isValid ? 'valid' : 'error'}`;
        }
    });
}

function openAddStudentModal() {
    if (!addStudentModal) return;
    resetAddForm();
    addStudentModal.classList.remove('hidden');
    lockBodyScroll();
    pushModalState();
}

function closeAddStudentModal() {
    if (!addStudentModal) return;
    addStudentModal.classList.add('hidden');
    resetAddForm();
    unlockBodyScroll();
}

if (btnAddStudent) btnAddStudent.addEventListener('click', openAddStudentModal);
if (btnCancelAdd) btnCancelAdd.addEventListener('click', closeAddStudentModal);

if (addStudentForm) {
    addStudentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameVal = newStudentNameInput.value.trim();
        const idVal = newStudentIdInput.value.trim().toLowerCase();
        const pinVal = newStudentPinInput.value.trim();

        if (nameVal.length < 3) {
            showToast("Name must be at least 3 characters", "error");
            return;
        }

        const duplicate = students.find(s => s.id === idVal);
        if (duplicate) {
            showToast("Student ID already exists.", "error");
            return;
        }

        const submitBtn = addStudentForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerText = "Saving...";

        const studentEmail = `${idVal}@student.ukquran.com`;
        const authPassword = toAuthPassword(pinVal);

        createUserWithEmailAndPassword(secondaryAuth, studentEmail, authPassword)
            .then(() => secondarySignOut(secondaryAuth))
            .then(() => {
                const newStudentRef = ref(database, `teachers/${currentTeacherUid}/students/${idVal}`);
                return set(newStudentRef, { name: nameVal, pin: pinVal });
            })
            .then(() => {
                students.push({
                    id: idVal, name: nameVal, pin: pinVal,
                    isPresent: false, newPages: 0, rev: 0, remarks: "", revHeardBy: "", expanded: false
                });
                closeAddStudentModal();
                renderStudents();
                showToast("Student added successfully!", "success");
            })
            .catch((err) => {
                console.error(err);
                showToast(err.code === 'auth/email-already-in-use' ? "Student ID already exists." : "Could not save student.", "error");
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerText = originalText;
            });
    });
}

// --- Delete Student ---
function openDeleteModal(studentId) {
    const student = students.find((item) => item.id === studentId);
    if (!student || !deleteStudentModal) return;
    pendingDeleteId = student.id;
    if (deleteStudentNameEl) deleteStudentNameEl.innerText = student.name;
    deleteStudentModal.classList.remove('hidden');
    lockBodyScroll();
    pushModalState();
}

function closeDeleteModal() {
    pendingDeleteId = null;
    if (deleteStudentModal) deleteStudentModal.classList.add('hidden');
    unlockBodyScroll();
}

if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);

if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', async () => {
        if (!pendingDeleteId || !currentTeacherUid) return;
        const idToDelete = pendingDeleteId;

        btnConfirmDelete.disabled = true;
        btnConfirmDelete.innerText = "Deleting...";

        try {
            await remove(ref(database, `teachers/${currentTeacherUid}/students/${idToDelete}`));
            students = students.filter(s => s.id !== idToDelete);
            renderStudents();
            closeDeleteModal();
            showToast("Student removed successfully.", "success");
        } catch (err) {
            console.error(err);
            showToast("Could not remove student.", "error");
        } finally {
            btnConfirmDelete.disabled = false;
            btnConfirmDelete.innerText = "Delete";
        }
    });
}

// --- Save Daily Report ---
if (btnSaveReport) {
    btnSaveReport.addEventListener('click', () => {
        if (!currentTeacherUid) return;
        btnSaveReport.disabled = true;
        if (btnSaveLabel) btnSaveLabel.innerText = "Saving to Database...";

        let logData = {};
        students.forEach(s => {
            logData[s.id] = {
                name: s.name,
                isPresent: s.isPresent,
                newPages: s.newPages || 0,
                rev: s.rev || 0,
                revHeardBy: s.revHeardBy || '',
                remarks: s.remarks || ''
            };
        });

        const logRef = ref(database, `teachers/${currentTeacherUid}/logs/${todayStr}`);
        set(logRef, logData)
            .then(() => {
                showToast("Daily report saved successfully!", "success");
                if (btnSaveLabel) btnSaveLabel.innerText = "✅ Saved Successfully!";
                setTimeout(() => { if (btnSaveLabel) btnSaveLabel.innerText = "Save Daily Report"; }, 2000);
            })
            .catch((err) => {
                console.error(err);
                showToast("Could not save report.", "error");
                if (btnSaveLabel) btnSaveLabel.innerText = "Save Daily Report";
            })
            .finally(() => {
                btnSaveReport.disabled = false;
            });
    });
}