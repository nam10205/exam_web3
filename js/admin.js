// admin.js - Admin interface functions

// Sidebar toggle for mobile
function initAdminSidebarToggle() {
    const toggleBtn = document.getElementById('btn-toggle-sidebar');
    const sidebar = document.querySelector('.admin-sidebar');

    if (!toggleBtn || !sidebar) return;
    if (toggleBtn.dataset.sidebarBound === 'true') return;

    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        document.body.appendChild(backdrop);
    }

    toggleBtn.dataset.sidebarBound = 'true';

    const closeSidebar = () => {
        sidebar.classList.remove('active');
        backdrop.classList.remove('active');
        toggleBtn.classList.remove('hidden');
    };

    const openSidebar = () => {
        sidebar.classList.add('active');
        backdrop.classList.add('active');
        toggleBtn.classList.add('hidden');
    };

    const syncSidebarState = () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        } else if (!sidebar.classList.contains('active')) {
            toggleBtn.classList.remove('hidden');
            backdrop.classList.remove('active');
        }
    };

    toggleBtn.addEventListener('click', () => {
        if (sidebar.classList.contains('active')) closeSidebar();
        else openSidebar();
    });

    backdrop.addEventListener('click', closeSidebar);

    document.querySelectorAll('.admin-nav a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) closeSidebar();
        });
    });

    window.addEventListener('resize', syncSidebarState);
    syncSidebarState();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminSidebarToggle);
} else {
    initAdminSidebarToggle();
}

function showAdminPage(pageId) {
    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    document.querySelectorAll('.admin-nav a').forEach(a => a.classList.remove('active'));
    if(document.getElementById('nav-' + pageId)) document.getElementById('nav-' + pageId).classList.add('active');

    if(pageId === 'admin-dashboard') updateDashboard();
    if(pageId === 'admin-exams') renderAdminExams();
    if(pageId === 'admin-users') renderAdminUsers();
    if(pageId === 'admin-stats') initChart();
}

function updateDashboard() {
    document.getElementById('dash-total-exams').innerText = EXAMS.length;
    document.getElementById('dash-total-users').innerText = USERS_DB.length;
}

function renderAdminExams() {
    const tbody = document.getElementById('admin-exam-tbody');
    tbody.innerHTML = '';
    if(EXAMS.length === 0) return tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Chưa có bài thi.</td></tr>';

    EXAMS.forEach(exam => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${exam.title}</strong></td>
                <td>${exam.type}</td>
                <td><span class="badge ${exam.status === 'free' ? 'free' : 'scheduled'}">${exam.status === 'free' ? 'Tự do' : 'Có thời hạn'}</span></td>
                <td>${exam.time} m</td>
                <td>${exam.questionsCount} câu</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="openExamForm(${exam.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm" style="background:var(--wrong-color);color:#fff" onclick="deleteExam(${exam.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

function deleteExam(id) {
    if(confirm('Xóa bài thi này?')) {
        EXAMS = EXAMS.filter(e => e.id !== id);
        delete QUESTIONS_DB[id];
        renderAdminExams();
    }
}

let editingExamId = null;
let tempQuestions = [];

function openExamForm(id = null) {
    editingExamId = id;
    if (id) {
        document.getElementById('form-exam-title').innerText = 'Chỉnh Sửa Bài Thi';
        const exam = EXAMS.find(e => e.id === id);
        document.getElementById('input-exam-title').value = exam.title;
        document.getElementById('input-exam-type').value = exam.type;
        document.getElementById('input-exam-status').value = exam.status;
        document.getElementById('input-exam-time').value = exam.time;
        tempQuestions = JSON.parse(JSON.stringify(QUESTIONS_DB[id] || []));
    } else {
        document.getElementById('form-exam-title').innerText = 'Tạo Bài Thi Mới';
        document.getElementById('input-exam-title').value = '';
        document.getElementById('input-exam-time').value = 15;
        tempQuestions = [];
    }
    renderTempQuestions();
    showAdminPage('admin-exam-form');
}

function renderTempQuestions() {
    const container = document.getElementById('questions-builder-container');
    container.innerHTML = '';
    if (tempQuestions.length === 0) return container.innerHTML = '<p style="text-align:center;">Chưa có câu hỏi nào.</p>';

    tempQuestions.forEach((q, index) => {
        let optsHtml = '';
        for(let i=0; i<4; i++) {
            let isChecked = (q.correct === i) ? 'checked' : '';
            optsHtml += `
                <div class="qb-option-row">
                    <input type="radio" name="correct-${index}" onchange="tempQuestions[${index}].correct = ${i}" ${isChecked}>
                    <input type="text" class="admin-input" placeholder="Lựa chọn ${i+1}" value="${q.options[i] || ''}" onchange="tempQuestions[${index}].options[${i}] = this.value" style="margin-bottom:0">
                </div>`;
        }
        container.innerHTML += `
            <div class="qb-item">
                <div class="qb-header"><span>Câu hỏi ${index + 1}</span><button class="btn btn-sm" style="background:red;color:white" onclick="removeQuestion(${index})">Xóa</button></div>
                <input type="text" class="admin-input" placeholder="Nội dung câu hỏi..." value="${q.text}" onchange="tempQuestions[${index}].text = this.value">
                <div style="margin-top: 10px;">${optsHtml}</div>
            </div>`;
    });
}

function addQuestionBuilder() { tempQuestions.push({ text: "", options: ["", "", "", ""], correct: 0 }); renderTempQuestions(); }
function removeQuestion(index) { tempQuestions.splice(index, 1); renderTempQuestions(); }
function importExcelMock() {
    alert('Mock: Đã import thành công 1 câu hỏi mẫu từ Excel!');
    tempQuestions.push({ text: "Câu hỏi từ file Excel?", options: ["Đáp án 1", "Đáp án 2", "Đáp án 3", "Đáp án 4"], correct: 0 });
    renderTempQuestions();
}

function saveExam() {
    const title = document.getElementById('input-exam-title').value.trim();
    if(!title || tempQuestions.length === 0) return alert("Vui lòng nhập tên và ít nhất 1 câu hỏi!");

    const examData = {
        title: title, type: document.getElementById('input-exam-type').value,
        status: document.getElementById('input-exam-status').value,
        time: parseInt(document.getElementById('input-exam-time').value),
        questionsCount: tempQuestions.length
    };

    if (editingExamId) {
        const index = EXAMS.findIndex(e => e.id === editingExamId);
        EXAMS[index] = { ...EXAMS[index], ...examData };
        QUESTIONS_DB[editingExamId] = [...tempQuestions];
    } else {
        const newId = Date.now();
        examData.id = newId;
        EXAMS.push(examData);
        QUESTIONS_DB[newId] = [...tempQuestions];
    }
    alert("Lưu thành công!");
    showAdminPage('admin-exams');
}

function renderAdminUsers() {
    const tbody = document.getElementById('admin-user-tbody');
    tbody.innerHTML = '';
    USERS_DB.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td>${u.id}</td><td>${u.name}</td><td>${u.username}</td><td>${u.attempts}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="openUserForm('${u.username}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm" style="background:var(--wrong-color);color:#fff" onclick="deleteUser('${u.username}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
    });
}

function deleteUser(username) {
    if(confirm('Xóa sinh viên này?')) {
        USERS_DB = USERS_DB.filter(u => u.username !== username);
        renderAdminUsers();
    }
}

function openUserForm(username = null) {
    if (username) {
        const u = USERS_DB.find(x => x.username === username);
        document.getElementById('form-user-title').innerText = 'Chỉnh sửa Sinh Viên';
        document.getElementById('input-u-oldusername').value = u.username;
        document.getElementById('input-u-id').value = u.id;
        document.getElementById('input-u-name').value = u.name;
        document.getElementById('input-u-username').value = u.username;
        document.getElementById('input-u-password').value = u.password;
    } else {
        document.getElementById('form-user-title').innerText = 'Thêm Sinh Viên Mới';
        document.getElementById('input-u-oldusername').value = '';
        document.getElementById('input-u-id').value = '';
        document.getElementById('input-u-name').value = '';
        document.getElementById('input-u-username').value = '';
        document.getElementById('input-u-password').value = '';
    }
    showAdminPage('admin-user-form');
}

function saveUser() {
    const oldUser = document.getElementById('input-u-oldusername').value;
    const id = document.getElementById('input-u-id').value.trim();
    const name = document.getElementById('input-u-name').value.trim();
    const username = document.getElementById('input-u-username').value.trim();
    const pass = document.getElementById('input-u-password').value;

    if(!id || !name || !username || !pass) return alert("Điền đủ thông tin!");

    if (oldUser) {
        // Edit
        const idx = USERS_DB.findIndex(u => u.username === oldUser);
        USERS_DB[idx] = { ...USERS_DB[idx], id, name, username, password: pass };
    } else {
        // Create
        if (USERS_DB.some(u => u.username === username)) return alert("Username đã tồn tại!");
        USERS_DB.push({ id, name, username, password: pass, attempts: 0 });
    }
    alert("Lưu sinh viên thành công!");
    showAdminPage('admin-users');
}