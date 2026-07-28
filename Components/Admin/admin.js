import { 
    onAuthStateChanged, 
    signOut, 
    createUserWithEmailAndPassword, 
    signOut as secondarySignOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, get, set, remove, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { auth, database, secondaryAuth } from "../../JavaScript/firebase-config.js";

const ADMIN_EMAIL = 'teacher@uk-quran.com';

const teachersContainer = document.getElementById('teachers-container');
const toastContainer = document.getElementById('toast-container');

// Modals & Forms
const modalTeacher = document.getElementById('modal-teacher');
const modalTeacherTitle = document.getElementById('modal-teacher-title');
const formTeacher = document.getElementById('form-teacher');
const teacherModeInput = document.getElementById('teacher-mode');
const editingTeacherUidInput = document.getElementById('editing-teacher-uid');
const teacherNameInput = document.getElementById('teacher-name');
const teacherNameHint = document.getElementById('teacher-name-hint');
const teacherEmailInput = document.getElementById('teacher-email');
const teacherEmailHint = document.getElementById('teacher-email-hint');
const teacherPasswordGroup = document.getElementById('teacher-password-group');
const teacherPasswordInput = document.getElementById('teacher-password');
const teacherPasswordHint = document.getElementById('teacher-password-hint');
const btnOpenAddTeacher = document.getElementById('btn-open-add-teacher');
const btnCloseTeacherModal = document.getElementById('btn-close-teacher-modal');

const modalAdminStudent = document.getElementById('modal-admin-student');
const adminStudentModalTitle = document.getElementById('admin-student-modal-title');
const formAdminStudent = document.getElementById('form-admin-student');
const studentModeInput = document.getElementById('student-mode');
const targetTeacherUidInput = document.getElementById('target-teacher-uid');
const editingStudentIdInput = document.getElementById('editing-student-id');
const adminStudentNameInput = document.getElementById('admin-student-name');
const adminStudentNameHint = document.getElementById('admin-student-name-hint');
const adminStudentIdInput = document.getElementById('admin-student-id');
const adminStudentIdHint = document.getElementById('admin-student-id-hint');
const adminStudentPinInput = document.getElementById('admin-student-pin');
const adminStudentPinHint = document.getElementById('admin-student-pin-hint');
const btnCloseAdminStudentModal = document.getElementById('btn-close-admin-student-modal');

const modalDeleteConfirm = document.getElementById('modal-delete-confirm');
const deleteModalTitle = document.getElementById('delete-modal-title');
const deleteModalText = document.getElementById('delete-modal-text');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');

const btnGotoTeacherView = document.getElementById('btn-goto-teacher-view');
const btnAdminLogout = document.getElementById('btn-admin-logout');

let pendingDeleteAction = null;

// SVG Icons
const trashIconSVG = `
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
    <path d="M10 11v6"></path><path d="M14 11v6"></path>
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
</svg>`;

const editIconSVG = `
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
</svg>`;

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

function lockBodyScroll() { document.body.classList.add('modal-open'); }
function unlockBodyScroll() { document.body.classList.remove('modal-open'); }

// Auth Observer
onAuthStateChanged(auth, (user) => {
    if (user && user.email && user.email.toLowerCase() === ADMIN_EMAIL) {
        loadAllTeachersAndStudents();
    } else {
        window.location.href = '../../index.html';
    }
});

// Load Teachers & Students
async function loadAllTeachersAndStudents() {
    teachersContainer.innerHTML = '<p style="color:#888;">Loading teachers and student data...</p>';

    try {
        const teachersSnap = await get(ref(database, 'teachers'));
        if (!teachersSnap.exists()) {
            teachersContainer.innerHTML = '<p style="color:#888;">No teachers registered yet.</p>';
            return;
        }

        teachersContainer.innerHTML = '';

        teachersSnap.forEach((teacherSnap) => {
            const teacherUid = teacherSnap.key;
            const teacherData = teacherSnap.val();
            const info = teacherData.info || {};
            const studentsObj = teacherData.students || {};

            const teacherName = info.name || (teacherUid === auth.currentUser.uid ? 'Main Admin Teacher' : 'Teacher');
            const teacherEmail = info.email || (teacherUid === auth.currentUser.uid ? ADMIN_EMAIL : `UID: ${teacherUid}`);
            const teacherPin = info.pin || '';

            const studentKeys = Object.keys(studentsObj);

            const card = document.createElement('div');
            const isMainAdmin = teacherUid === auth.currentUser.uid;
            card.className = 'teacher-card-admin';
            card.id = `teacher-card-${teacherUid}`;

            let studentsHTML = '';
            if (studentKeys.length === 0) {
                studentsHTML = '<p style="font-size:12px; color:#888; margin:8px 0;">No students assigned yet.</p>';
            } else {
                studentsHTML = '<div class="student-grid-admin">';
                studentKeys.forEach((sId) => {
                    const st = studentsObj[sId];
                    studentsHTML += `
                        <div class="student-item-admin">
                            <div class="student-item-info">
                                <h5 title="${st.name}">${st.name}</h5>
                                <p>ID: ${sId} | PIN: ${st.pin}</p>
                            </div>
                            <div class="admin-actions">
                                <button class="icon-btn-edit" title="Edit Student" onclick="event.stopPropagation(); window.adminOpenEditStudent('${teacherUid}', '${sId}', '${st.name}', '${st.pin}')">
                                    ${editIconSVG}
                                </button>
                                <button class="icon-btn-delete" title="Delete Student" onclick="event.stopPropagation(); window.adminConfirmDeleteStudent('${teacherUid}', '${sId}', '${st.name}')">
                                    ${trashIconSVG}
                                </button>
                            </div>
                        </div>
                    `;
                });
                studentsHTML += '</div>';
            }

            card.innerHTML = `
                <div class="teacher-header-row" onclick="window.toggleTeacherAccordion('${teacherUid}')">
                    <div class="teacher-info-box">
                        <h3 class="teacher-name">${teacherName}</h3>
                        <p class="teacher-meta">ID : ${teacherEmail}</p>
                        ${teacherPin ? `<p class="teacher-meta">PIN : ${teacherPin}</p>` : ''}
                        <span class="teacher-badge-count">${studentKeys.length} Students</span>
                    </div>
                    <span class="accordion-arrow">▾</span>
                </div>

                <div class="teacher-actions-bar">
                    <button type="button" class="btn-sm-primary" onclick="event.stopPropagation(); window.adminOpenAddStudent('${teacherUid}', '${teacherName}')">+ Add Student</button>
                    ${!isMainAdmin ? `
                    <button type="button" class="icon-btn-edit" title="Edit Teacher Info" onclick="event.stopPropagation(); window.adminOpenEditTeacher('${teacherUid}', '${teacherName}', '${teacherEmail}', '${teacherPin}')">
                        ${editIconSVG}
                    </button>` : ''}
                    ${!isMainAdmin ? `
                    <button type="button" class="icon-btn-delete" title="Delete Teacher" onclick="event.stopPropagation(); window.adminConfirmDeleteTeacher('${teacherUid}', '${teacherName}')">
                        ${trashIconSVG}
                    </button>` : ''}
                </div>

                <div class="student-section-admin">
                    <h4 style="font-size:13px; color:#475569; margin:10px 0 6px;">Students (${studentKeys.length}):</h4>
                    ${studentsHTML}
                </div>
            `;

            teachersContainer.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        showToast('Error loading teachers.', 'error');
    }
}

// Accordion Toggle
window.toggleTeacherAccordion = (teacherUid) => {
    const card = document.getElementById(`teacher-card-${teacherUid}`);
    if (card) card.classList.toggle('open');
};

// Open Add Teacher Modal
btnOpenAddTeacher?.addEventListener('click', () => {
    teacherModeInput.value = 'add';
    modalTeacherTitle.innerText = 'Add New Teacher';
    teacherNameInput.value = '';
    teacherEmailInput.value = '';
    teacherPasswordInput.value = '';
    teacherEmailInput.disabled = false;
    if (teacherEmailHint) {
        teacherEmailHint.textContent = 'Enter a valid email address.';
        teacherEmailHint.className = 'field-hint';
    }
    teacherPasswordGroup.style.display = 'block';
    teacherPasswordInput.required = true;
    teacherPasswordInput.placeholder = '••••••••';
    modalTeacher.classList.remove('hidden');
    lockBodyScroll();
});

// Open Edit Teacher Modal
window.adminOpenEditTeacher = (teacherUid, name, email, pin = '') => {
    teacherModeInput.value = 'edit';
    editingTeacherUidInput.value = teacherUid;
    modalTeacherTitle.innerText = 'Edit Teacher Info';
    teacherNameInput.value = name;

    // Email is the fixed Auth login credential — cannot be changed after creation
    teacherEmailInput.value = email;
    teacherEmailInput.disabled = true;
    if (teacherEmailHint) {
        teacherEmailHint.textContent = 'Login email is fixed and cannot be changed after creation.';
        teacherEmailHint.className = 'field-hint';
    }

    // PIN/password is also fixed after creation — hide entirely in edit mode
    teacherPasswordGroup.style.display = 'none';
    teacherPasswordInput.required = false;
    teacherPasswordInput.value = '';

    modalTeacher.classList.remove('hidden');
    lockBodyScroll();
};

function closeTeacherModal() {
    if (modalTeacher) modalTeacher.classList.add('hidden');
    if (formTeacher) formTeacher.reset();
    unlockBodyScroll();
}

btnCloseTeacherModal?.addEventListener('click', closeTeacherModal);
if (modalTeacher) {
    modalTeacher.addEventListener('click', (e) => {
        if (e.target === modalTeacher) closeTeacherModal();
    });
}

// Form Submission for Add / Edit Teacher
formTeacher?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mode = teacherModeInput.value;
    const name = teacherNameInput.value.trim();
    const email = teacherEmailInput.value.trim().toLowerCase();
    const password = teacherPasswordInput.value.trim();

    if (name.length < 3) {
        showToast('Name must be at least 3 characters.', 'error');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Enter a valid email address.', 'error');
        return;
    }

    const saveBtn = formTeacher.querySelector('button[type="submit"]');
    saveBtn.disabled = true;
    saveBtn.innerText = 'Saving...';

    try {
        if (mode === 'add') {
            if (password.length < 6) {
                showToast('Password must be at least 6 characters.', 'error');
                saveBtn.disabled = false;
                saveBtn.innerText = 'Save Teacher';
                return;
            }

            const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const newTeacherUid = userCred.user.uid;
            await secondarySignOut(secondaryAuth);

            await set(ref(database, `teachers/${newTeacherUid}/info`), { 
                name, 
                email, 
                authEmail: email, // Preserves creation Auth email
                pin: password 
            });
            showToast('Teacher created successfully!', 'success');
        } else {
            // EDIT MODE: Name is the only editable field.
            // Email and PIN are the Auth login credentials, fixed at creation —
            // they cannot be changed here without a Cloud Function to update
            // the actual Firebase Auth account, so we don't touch them.
            const uid = editingTeacherUidInput.value;
            await update(ref(database, `teachers/${uid}/info`), { name });
            showToast('Teacher updated successfully!', 'success');
        }

        closeTeacherModal();
        loadAllTeachersAndStudents();
    } catch (err) {
        console.error(err);
        showToast(err.code === 'auth/email-already-in-use' ? 'Email is already registered.' : 'Could not save teacher.', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = 'Save Teacher';
    }
});

// Student Modal Open Handlers
window.adminOpenAddStudent = (teacherUid, teacherName) => {
    studentModeInput.value = 'add';
    targetTeacherUidInput.value = teacherUid;
    adminStudentModalTitle.innerText = `Add Student to ${teacherName}`;
    adminStudentNameInput.value = '';
    adminStudentIdInput.value = '';
    adminStudentPinInput.value = '';
    adminStudentIdInput.disabled = false;
    adminStudentPinInput.required = true;
    const pinLabel = document.getElementById('admin-student-pin-label');
    if (pinLabel) pinLabel.style.removeProperty('display');
    adminStudentPinInput.style.display = '';
    if (adminStudentPinHint) adminStudentPinHint.style.display = '';
    modalAdminStudent.classList.remove('hidden');
    lockBodyScroll();
};

window.adminOpenEditStudent = (teacherUid, studentId, studentName, studentPin) => {
    studentModeInput.value = 'edit';
    targetTeacherUidInput.value = teacherUid;
    editingStudentIdInput.value = studentId;
    adminStudentModalTitle.innerText = `Edit ${studentName}`;
    adminStudentNameInput.value = studentName;
    adminStudentIdInput.value = studentId;
    adminStudentIdInput.disabled = true;

    // PIN is the Auth login credential, fixed at creation — hide the field in edit mode
    adminStudentPinInput.value = '';
    adminStudentPinInput.required = false;
    const pinLabel = document.getElementById('admin-student-pin-label');
    if (pinLabel) pinLabel.style.setProperty('display', 'none', 'important');
    adminStudentPinInput.style.display = 'none';
    if (adminStudentPinHint) adminStudentPinHint.style.display = 'none';

    modalAdminStudent.classList.remove('hidden');
    lockBodyScroll();
};

function closeAdminStudentModal() {
    if (modalAdminStudent) modalAdminStudent.classList.add('hidden');
    if (formAdminStudent) formAdminStudent.reset();
    unlockBodyScroll();
}

btnCloseAdminStudentModal?.addEventListener('click', closeAdminStudentModal);
if (modalAdminStudent) {
    modalAdminStudent.addEventListener('click', (e) => {
        if (e.target === modalAdminStudent) closeAdminStudentModal();
    });
}

formAdminStudent?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mode = studentModeInput.value;
    const teacherUid = targetTeacherUidInput.value;
    const studentId = adminStudentIdInput.value.trim().toLowerCase();
    const name = adminStudentNameInput.value.trim();
    const pin = adminStudentPinInput.value.trim();

    if (name.length < 3) {
        showToast('Name must be at least 3 characters.', 'error');
        return;
    }
    if (mode === 'add' && !/^\d{4,}$/.test(pin)) {
        showToast('PIN must be at least 4 digits.', 'error');
        return;
    }

    const saveBtn = formAdminStudent.querySelector('button[type="submit"]');
    saveBtn.disabled = true;
    saveBtn.innerText = 'Saving...';

    try {
        if (mode === 'add') {
            const studentEmail = `${studentId}@student.ukquran.com`;
            const authPass = toAuthPassword(pin);

            await createUserWithEmailAndPassword(secondaryAuth, studentEmail, authPass);
            await secondarySignOut(secondaryAuth);

            await set(ref(database, `teachers/${teacherUid}/students/${studentId}`), { name, pin });
            showToast('Student created successfully!', 'success');
        } else {
            // EDIT MODE: Name is the only editable field.
            // PIN is the Auth login credential, fixed at creation —
            // changing it here would break login (see teacher edit fix).
            await update(ref(database, `teachers/${teacherUid}/students/${studentId}`), { name });
            showToast('Student updated successfully!', 'success');
        }

        closeAdminStudentModal();
        loadAllTeachersAndStudents();
    } catch (err) {
        console.error(err);
        showToast(err.code === 'auth/email-already-in-use' ? 'Student ID already exists.' : 'Could not save student.', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = 'Save Student';
    }
});

// Delete Confirm Modal Handlers
window.adminConfirmDeleteTeacher = (teacherUid, teacherName) => {
    deleteModalTitle.innerText = 'Delete Teacher?';
    deleteModalText.innerText = `Are you sure you want to delete ${teacherName}? All students under this teacher will be removed.`;
    pendingDeleteAction = async () => {
        await remove(ref(database, `teachers/${teacherUid}`));
        showToast(`Teacher ${teacherName} removed.`, 'success');
    };
    modalDeleteConfirm.classList.remove('hidden');
    lockBodyScroll();
};

window.adminConfirmDeleteStudent = (teacherUid, studentId, studentName) => {
    deleteModalTitle.innerText = 'Remove Student?';
    deleteModalText.innerText = `Are you sure you want to remove ${studentName}?`;
    pendingDeleteAction = async () => {
        await remove(ref(database, `teachers/${teacherUid}/students/${studentId}`));
        showToast(`Student ${studentName} removed.`, 'success');
    };
    modalDeleteConfirm.classList.remove('hidden');
    lockBodyScroll();
};

function closeDeleteConfirmModal() {
    if (modalDeleteConfirm) modalDeleteConfirm.classList.add('hidden');
    pendingDeleteAction = null;
    unlockBodyScroll();
}

btnCancelDelete?.addEventListener('click', closeDeleteConfirmModal);
if (modalDeleteConfirm) {
    modalDeleteConfirm.addEventListener('click', (e) => {
        if (e.target === modalDeleteConfirm) closeDeleteConfirmModal();
    });
}

btnConfirmDelete?.addEventListener('click', async () => {
    if (!pendingDeleteAction) return;
    btnConfirmDelete.disabled = true;
    btnConfirmDelete.innerText = 'Deleting...';

    try {
        await pendingDeleteAction();
        closeDeleteConfirmModal();
        loadAllTeachersAndStudents();
    } catch (err) {
        showToast('Delete operation failed.', 'error');
    } finally {
        btnConfirmDelete.disabled = false;
        btnConfirmDelete.innerText = 'Delete';
    }
});

btnGotoTeacherView?.addEventListener('click', () => window.location.href = '../Teacher/teacher.html');
btnAdminLogout?.addEventListener('click', () => signOut(auth).then(() => window.location.href = '../../index.html'));