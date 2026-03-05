function toText(content) {
    if (content === null || content === undefined) return "";
    const temp = document.createElement('div');
    temp.textContent = content; 
    return temp.innerHTML; 
}

let EXAMS = [
    { id: 1, title: 'Bài tập Demo: HTML Cơ bản', type: 'Luyện tập', status: 'free', time: 5, questionsCount: 2 }
];

let QUESTIONS_DB = {
    1: [
        { text: "Thẻ tạo liên kết trong HTML?", options: ["<a>", "<b>", "<link>", "<nav>"], correct: 0 },
        { text: "HTML là viết tắt của?", options: ["Hyper Text", "Hyperlinks", "Hyper Text Markup Language", "Không có đáp án đúng"], correct: 2 }
    ]
};

let USERS_DB = [
    { id: 'SV001', name: 'Nguyễn Văn A', username: 'sinhvien', password: '123', attempts: 5 },
    { id: 'SV002', name: 'Nguyễn Quang Anh', username: 'test', password: 'test', attempts: 5 }

];

// ================= BIẾN TOÀN CỤC =================
let currentUser = null;
let currentExam = null;
let currentQuestions = [];
let userAnswers = {}; 
let timerInterval;
let timeLeft = 0;
let isLoginMode = true; // Chế độ form Đăng nhập/Đăng ký
let chartInstance = null;

// ================= XỬ LÝ AUTH (ĐĂNG NHẬP / ĐĂNG KÝ) =================
const authSwitchLink = document.getElementById('auth-switch-link');
const authTitle = document.getElementById('auth-title');
const authSubmitBtn = document.getElementById('btn-submit');
const authError = document.getElementById('auth-error');

authSwitchLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    document.getElementById('register-fields').style.display = isLoginMode ? 'none' : 'block';
    document.getElementById('register-password-field').style.display = isLoginMode ? 'none' : 'block';
    
    authTitle.innerText = isLoginMode ? 'Đăng Nhập' : 'Đăng Ký Tài Khoản';
    authSubmitBtn.innerText = isLoginMode ? 'Đăng Nhập' : 'Đăng Ký';
    document.getElementById('auth-switch-text').innerText = isLoginMode ? 'Chưa có tài khoản?' : 'Đã có tài khoản?';
    authSwitchLink.innerText = isLoginMode ? 'Đăng ký' : 'Đăng nhập';
    document.getElementById('auth-hint').style.display = isLoginMode ? 'block' : 'none';
    authError.innerText = '';
});

document.getElementById('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value;
    
    authError.innerText = '';

    if (isLoginMode) {
        // --- XỬ LÝ ĐĂNG NHẬP ---
        if (user === 'admin' && pass === 'admin') {
            document.getElementById('auth-page').classList.remove('active');
            document.getElementById('admin-layout').style.display = 'flex';
            showAdminPage('admin-dashboard');
        } else {
            const student = USERS_DB.find(u => u.username === user && u.password === pass);
            if (student) {
                currentUser = student;
                document.getElementById('display-name').innerText = `Sinh viên: ${student.name}`;
                document.getElementById('auth-page').classList.remove('active');
                document.getElementById('student-layout').style.display = 'block';
                showStudentPage('home-page');
                renderStudentExams();
            } else {
                authError.innerText = 'Tên đăng nhập hoặc mật khẩu không đúng!';
            }
        }
    } else {
        // --- XỬ LÝ ĐĂNG KÝ ---
        const repass = document.getElementById('re-password').value;
        const studentId = document.getElementById('reg-id').value.trim();
        const studentName = document.getElementById('reg-name').value.trim();

        if (!studentId || !studentName || !user || !pass) return authError.innerText = 'Vui lòng điền đủ thông tin!';
        if (pass !== repass) return authError.innerText = 'Mật khẩu xác nhận không khớp!';
        if (USERS_DB.some(u => u.username === user)) return authError.innerText = 'Tên đăng nhập đã tồn tại!';

        USERS_DB.push({ id: studentId, name: studentName, username: user, password: pass, attempts: 0 });
        alert('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.');
        
        // Trở về form Login
        authSwitchLink.click(); 
        document.getElementById('username').value = user;
    }
});

document.querySelectorAll('.btn-logout').forEach(btn => {
    btn.addEventListener('click', () => {
        currentUser = null;
        document.getElementById('auth-form').reset();
        document.getElementById('student-layout').style.display = 'none';
        document.getElementById('admin-layout').style.display = 'none';
        document.getElementById('auth-page').classList.add('active');
        clearInterval(timerInterval);
    });
});

// ================= GIAO DIỆN SINH VIÊN =================
function showStudentPage(pageId) {
    document.querySelectorAll('#student-layout .page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function renderStudentExams() {
    const list = document.getElementById('exam-list');
    list.innerHTML = '';
    if(EXAMS.length === 0) return list.innerHTML = '<p style="color:red">Hiện chưa có bài thi nào.</p>';

    EXAMS.forEach(exam => {
        list.innerHTML += `
            <div class="exam-card">
                <span class="badge ${exam.status === 'free' ? 'free' : 'scheduled'}">${exam.status === 'free' ? 'Tự do' : 'Có thời hạn'}</span>
                <h4>${exam.title}</h4>
                <div class="exam-meta">
                    <p><i class="fas fa-list-ul"></i> Loại: ${exam.type}</p>
                    <p><i class="fas fa-question-circle"></i> Số câu: ${exam.questionsCount}</p>
                    <p><i class="fas fa-clock"></i> Thời gian: ${exam.time} phút</p>
                </div>
                <button class="btn btn-primary" style="width:100%" onclick="startExam(${exam.id})">Bắt Đầu Làm Bài</button>
            </div>
        `;
    });
}

function startExam(id) {
    currentExam = EXAMS.find(e => e.id === id);
    currentQuestions = QUESTIONS_DB[id] || [];
    if (currentQuestions.length === 0) return alert("Bài thi này chưa có câu hỏi nào!");

    userAnswers = {};
    document.getElementById('quiz-title').innerText = currentExam.title;
    const container = document.getElementById('questions-container');
    container.innerHTML = '';
    
    currentQuestions.forEach((q, qIndex) => {
        let optionsHtml = '';
        q.options.forEach((opt, oIndex) => {
            optionsHtml += `<label class="option-label" id="label-${qIndex}-${oIndex}">
                <input type="radio" name="q${qIndex}" onchange="selectAnswer(${qIndex}, ${oIndex})"> ${toText(opt)}
            </label>`;
        });
        container.innerHTML += `<div class="question-card"><div class="question-title">Câu ${qIndex + 1}: ${toText(q.text)}</div><div class="options-group">${optionsHtml}</div></div>`;
    });

    showStudentPage('quiz-page');
    timeLeft = currentExam.time * 60;
    updateTimerUI();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (timeLeft <= 0) { clearInterval(timerInterval); alert("Hết giờ!"); submitQuiz(); }
        else { timeLeft--; updateTimerUI(); }
    }, 1000);
}

function selectAnswer(qIndex, oIndex) {
    userAnswers[qIndex] = oIndex;
    document.querySelectorAll(`input[name="q${qIndex}"]`).forEach(r => r.parentElement.classList.remove('selected'));
    document.getElementById(`label-${qIndex}-${oIndex}`).classList.add('selected');
}

function updateTimerUI() {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('time-left').innerText = `${m}:${s}`;
}

document.getElementById('btn-submit-quiz').addEventListener('click', () => {
    if(confirm('Bạn muốn nộp bài chứ?')) { clearInterval(timerInterval); submitQuiz(); }
});

function submitQuiz() {
    let correct = 0, wrong = 0, skip = 0;
    currentQuestions.forEach((q, i) => {
        if (userAnswers[i] === undefined) skip++;
        else if (userAnswers[i] === q.correct) correct++;
        else wrong++;
    });
    
    document.getElementById('score-text').innerText = `${((correct / currentQuestions.length) * 10).toFixed(1)}`;
    document.getElementById('stat-correct').innerText = correct;
    document.getElementById('stat-wrong').innerText = wrong;
    document.getElementById('stat-skip').innerText = skip;

    // Tăng số lượt làm bài của User (Mock)
    if(currentUser) currentUser.attempts += 1;

    const container = document.getElementById('review-container');
    container.innerHTML = '';
    currentQuestions.forEach((q, i) => {
        const isCorrect = userAnswers[i] === q.correct;
        const isSkip = userAnswers[i] === undefined;
        let opts = '';
        q.options.forEach((opt, oIdx) => {
            let c = 'review-option';
            if (oIdx === q.correct) c += ' is-correct';
            else if (oIdx === userAnswers[i] && !isCorrect) c += ' is-wrong';
            opts += `<div class="${c}">${toText(opt)}</div>`;
        });
        container.innerHTML += `<div class="review-card ${isSkip ? '' : (isCorrect ? 'correct-card' : 'wrong-card')}">
            <h4>Câu ${i+1}: ${toText(q.text)} ${isSkip ? '(Chưa làm)' : (isCorrect ? '<i class="fas fa-check" style="color:green"></i>' : '<i class="fas fa-times" style="color:red"></i>')}</h4>
            ${opts}
        </div>`;
    });
    showStudentPage('result-page');
}

document.getElementById('btn-back-home').addEventListener('click', () => { showStudentPage('home-page'); });


// ================= GIAO DIỆN ADMIN =================
function showAdminPage(pageId) {
    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    document.querySelectorAll('.admin-nav a').forEach(a => a.classList.remove('active'));
    if(document.getElementById('nav-' + pageId)) document.getElementById('nav-' + pageId).classList.add('active');

    // Trigger update data
    if(pageId === 'admin-dashboard') updateDashboard();
    if(pageId === 'admin-exams') renderAdminExams();
    if(pageId === 'admin-users') renderAdminUsers();
    if(pageId === 'admin-stats') initChart();
}

function updateDashboard() {
    document.getElementById('dash-total-exams').innerText = EXAMS.length;
    document.getElementById('dash-total-users').innerText = USERS_DB.length;
}

// ---- QUẢN LÝ KỲ THI ----
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

// ---- QUẢN LÝ SINH VIÊN ----
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

// ---- THỐNG KÊ (CHART) ----
function initChart() {
    if (chartInstance) chartInstance.destroy();
    const ctx = document.getElementById('scoreChart').getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Dưới 5đ', '5đ - 7đ', '7đ - 8.5đ', 'Trên 8.5đ'],
            datasets: [{
                label: 'Phân phối điểm số',
                data: [10, 35, 80, 50], // Dữ liệu fix cứng (Mock)
                backgroundColor: ['#ffcdd2', '#ffb74d', '#81c784', '#d32f2f'],
                borderRadius: 4
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}