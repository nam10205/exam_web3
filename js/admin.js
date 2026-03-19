(function () {

    window.tempQuestions = [];
    window.editingExamId = null;
    window._allAttempts = [];

    // ===== CHUYỂN TRANG =====
    window.showAdminPage = (pageId) => {
        document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.admin-nav a').forEach(a => a.classList.remove('active'));

        const target = document.getElementById(pageId);
        if (target) target.classList.add('active');
        const navEl = document.getElementById('nav-' + pageId);
        if (navEl) navEl.classList.add('active');

        if (pageId === 'admin-dashboard') loadDashboard();
        if (pageId === 'admin-exams') loadAdminExams();
        if (pageId === 'admin-users') window.renderAdminUsers();
        if (pageId === 'admin-stats') initChart();         // Biểu đồ Chart.js
        if (pageId === 'admin-search') loadSearchPage();    // Bảng tra cứu
    };

    // ===== DASHBOARD =====
    async function loadDashboard() {
        try {
            const [resExams, resUsers, resAttempts] = await Promise.all([
                fetch(`${window.API_BASE}/exams/`),
                fetch(`${window.API_BASE}/users/`),
                fetch(`${window.API_BASE}/attempts/`)
            ]);
            const exams = await resExams.json();
            const users = await resUsers.json();
            const attempts = await resAttempts.json();

            const el = id => document.getElementById(id);
            if (el('dash-total-exams')) el('dash-total-exams').innerText = Array.isArray(exams) ? exams.length : '—';
            if (el('dash-total-users')) el('dash-total-users').innerText = Array.isArray(users) ? users.length : '—';
            if (el('dash-total-attempts')) el('dash-total-attempts').innerText = Array.isArray(attempts) ? attempts.length : '—';
        } catch (e) {
            console.error("Lỗi load dashboard:", e);
        }
    }

    // ===== DANH SÁCH ĐỀ THI =====
    async function loadAdminExams() {
        const tbody = document.getElementById('admin-exam-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Đang tải...</td></tr>';
        try {
            const res = await fetch(`${window.API_BASE}/exams/`);
            const exams = await res.json();
            if (!exams.length) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chưa có đề thi nào.</td></tr>';
                return;
            }
            const typeLabel = { 1: 'Trắc nghiệm', 2: 'Tự luận', 3: 'Hỗn hợp' };
            tbody.innerHTML = exams.map(e => `
                <tr>
                    <td><strong>${e.title}</strong></td>
                    <td>${typeLabel[e.type] || 'Trắc nghiệm'}</td>
                    <td>${e.question_count ?? '—'}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="openExamForm(${e.id})">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button class="btn btn-danger btn-sm" style="margin-left:6px;" onclick="deleteExam(${e.id})">
                            <i class="fas fa-trash"></i> Xóa
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="4" style="color:red;">Lỗi tải dữ liệu.</td></tr>';
        }
    }

    // ===== TRA CỨU: load bảng + ô lọc =====
    async function loadSearchPage() {
        const tbody = document.getElementById('search-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Đang tải...</td></tr>';
        try {
            const res = await fetch(`${window.API_BASE}/attempts/`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            window._allAttempts = data;
            renderSearchTable(data);
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="5" style="color:red;">Lỗi: ${e.message}</td></tr>`;
        }
    }

    function renderSearchTable(data) {
        const tbody = document.getElementById('search-tbody');
        const countEl = document.getElementById('search-count');
        if (!tbody) return;

        if (!data.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Không có kết quả.</td></tr>';
            if (countEl) countEl.innerText = '';
            return;
        }
        if (countEl) countEl.innerText = `${data.length} kết quả`;

        tbody.innerHTML = data.map(row => {
            const diem10 = row.total > 0 ? ((row.score / row.total) * 10).toFixed(1) : '—';
            const diem = parseFloat(diem10);
            const pillCls = diem >= 8 ? 'good' : diem >= 5 ? 'mid' : 'bad';
            const tg = row.created_at
                ? new Date(row.created_at).toLocaleString('vi-VN')
                : '—';
            return `
                <tr>
                    <td>${row.msv}</td>
                    <td>${row.ho_ten}</td>
                    <td>${row.ten_de}</td>
                    <td><span class="score-pill ${pillCls}">${diem10} đ</span></td>
                    <td style="font-size:12px; color:#888;">${tg}</td>
                </tr>`;
        }).join('');
    }

    window.filterSearch = () => {
        const q = (document.getElementById('search-filter')?.value || '').toLowerCase();
        const filtered = window._allAttempts.filter(r =>
            (r.ho_ten || '').toLowerCase().includes(q) ||
            (r.ten_de || '').toLowerCase().includes(q) ||
            String(r.msv || '').toLowerCase().includes(q)
        );
        renderSearchTable(filtered);
    };

    // ===== FORM TẠO / SỬA ĐỀ =====
    window.openExamForm = async (id = null) => {
        window.editingExamId = id;
        window.tempQuestions = [];
        const formTitle = document.getElementById('form-exam-title');
        const inputTitle = document.getElementById('input-exam-title');

        if (id) {
            if (formTitle) formTitle.innerText = 'Chỉnh Sửa Đề Thi';
            try {
                const res = await fetch(`${window.API_BASE}/examdetail?id=${id}`);
                const data = await res.json();
                if (inputTitle) inputTitle.value = data.title || '';
                const typeEl = document.getElementById('input-exam-type');
                if (typeEl) typeEl.value = data.type || 1;
                window.tempQuestions = (data.questions || []).map(q => ({
                    text: q.content, options: q.choices.map(c => c.content), correct: 0
                }));
            } catch (e) { alert("Lỗi tải chi tiết đề!"); return; }
        } else {
            if (formTitle) formTitle.innerText = 'Tạo Đề Thi Mới';
            if (inputTitle) inputTitle.value = '';
        }
        renderTempQuestions();
        showAdminPage('admin-exam-form');
    };

    function renderTempQuestions() {
        const container = document.getElementById('questions-builder-container');
        if (!container) return;
        if (!window.tempQuestions.length) {
            container.innerHTML = '<p style="text-align:center; color:#888; padding:20px 0;">Chưa có câu hỏi. Nhấn "+ Thêm câu" để bắt đầu.</p>';
            return;
        }
        container.innerHTML = window.tempQuestions.map((q, index) => {
            let optsHtml = '';
            for (let i = 0; i < 4; i++) {
                optsHtml += `
                    <div class="qb-option-row">
                        <input type="radio" name="correct-${index}"
                            ${q.correct === i ? 'checked' : ''}
                            onchange="window.tempQuestions[${index}].correct = ${i}">
                        <input type="text" class="admin-input"
                            placeholder="Lựa chọn ${i + 1}"
                            value="${(q.options[i] || '').replace(/"/g, '&quot;')}"
                            oninput="window.tempQuestions[${index}].options[${i}] = this.value"
                            style="margin-bottom:0;">
                    </div>`;
            }
            return `
                <div class="qb-item">
                    <div class="qb-header">
                        <span>Câu hỏi ${index + 1}</span>
                        <button class="btn btn-danger btn-sm" onclick="removeQuestion(${index})">
                            <i class="fas fa-times"></i> Xóa
                        </button>
                    </div>
                    <input type="text" class="admin-input"
                        placeholder="Nội dung câu hỏi..."
                        value="${(q.text || '').replace(/"/g, '&quot;')}"
                        oninput="window.tempQuestions[${index}].text = this.value">
                    <div style="margin-top:8px;">${optsHtml}</div>
                </div>`;
        }).join('');
    }

    window.addQuestionBuilder = () => {
        window.tempQuestions.push({ text: '', options: ['', '', '', ''], correct: 0 });
        renderTempQuestions();
    };

    window.removeQuestion = (index) => {
        window.tempQuestions.splice(index, 1);
        renderTempQuestions();
    };

    // ===== LƯU ĐỀ =====
    window.saveExam = async () => {
        const title = document.getElementById('input-exam-title')?.value.trim();
        const type = parseInt(document.getElementById('input-exam-type')?.value || 1);
        if (!title) { alert("Vui lòng nhập tên đề!"); return; }
        if (!window.tempQuestions.length) { alert("Vui lòng thêm ít nhất 1 câu hỏi!"); return; }

        const payload = {
            title, type,
            questions: window.tempQuestions.map(q => ({
                content: q.text,
                choices: q.options.map((o, idx) => ({ content: o, is_correct: idx === q.correct }))
            }))
        };
        const url = window.editingExamId
            ? `${window.API_BASE}/updateexam/?id=${window.editingExamId}`
            : `${window.API_BASE}/createexam/`;
        const method = window.editingExamId ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert(window.editingExamId ? "Cập nhật thành công!" : "Tạo đề thành công!");
                showAdminPage('admin-exams');
            } else {
                const err = await res.json();
                alert("Lỗi: " + (err.error || "Không xác định"));
            }
        } catch (e) { alert("Lỗi kết nối server!"); }
    };

    // ===== XÓA ĐỀ =====
    window.deleteExam = async (id) => {
        if (!confirm("Xóa đề thi này? Không thể hoàn tác!")) return;
        try {
            const res = await fetch(`${window.API_BASE}/deleteexam/?id=${id}`, { method: 'DELETE' });
            if (res.ok) { alert("Xóa thành công!"); loadAdminExams(); }
        } catch (e) { alert("Lỗi xóa đề!"); }
    };

    // ===== SINH VIÊN =====
    window.renderAdminUsers = async () => {
        const tbody = document.getElementById('admin-user-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Đang tải...</td></tr>';
        try {
            const res = await fetch(`${window.API_BASE}/users/`);
            const users = await res.json();
            if (!users.length) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chưa có sinh viên nào.</td></tr>';
                return;
            }
            tbody.innerHTML = users.map(u => `
                <tr>
                    <td>${u.id}</td><td>${u.name}</td><td>${u.username}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteUser('${u.username}')">
                            <i class="fas fa-trash"></i> Xóa
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (e) { console.error("Lỗi tải danh sách user"); }
    };

    window.deleteUser = async (uname) => {
        if (!confirm(`Xóa sinh viên "${uname}"?`)) return;
        try {
            await fetch(`${window.API_BASE}/deleteuser/?username=${uname}`, { method: 'DELETE' });
            window.renderAdminUsers();
        } catch (e) { alert("Lỗi xóa sinh viên!"); }
    };

})();