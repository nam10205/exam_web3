(function () {

    window.currentExam = null;
    window.currentQuestions = [];
    window.userAnswers = {};
    window.timerInterval = null;

    let examSearchKeyword = '';
    let examTypeFilter = 'all';

    window.showStudentPage = (pageId) => {
        document.querySelectorAll('#student-layout .page')
            .forEach(p => p.classList.remove('active'));
        const target = document.getElementById(pageId);
        if (target) target.classList.add('active');
    };

    function getTypeLabel(type) {
        const value = String(type ?? '').toLowerCase();
        if (value === '1' || value.includes('luyện')) return 'Luyện tập';
        if (value === '2' || value.includes('giữa')) return 'Giữa kỳ';
        if (value === '3' || value.includes('cuối')) return 'Cuối kỳ';
        return String(type || 'Luyện tập');
    }

    function bindExamFilters() {
        const searchInput = document.getElementById('exam-search');
        const typeSelect = document.getElementById('exam-type-filter');

        if (!searchInput || !typeSelect) return;
        if (searchInput.dataset.bound === 'true') return;

        searchInput.dataset.bound = 'true';

        searchInput.addEventListener('input', (e) => {
            examSearchKeyword = e.target.value.trim().toLowerCase();
            window.renderStudentExams();
        });

        typeSelect.addEventListener('change', (e) => {
            examTypeFilter = e.target.value;
            window.renderStudentExams();
        });
    }

    window.renderStudentExams = async () => {
        const list = document.getElementById('exam-list');
        if (!list) return;
        bindExamFilters();

        try {
            const res = await fetch(`${window.API_BASE}/exams/`);
            const exams = await res.json();
            if (!Array.isArray(exams) || !exams.length) {
                list.innerHTML = '<div class="exam-card"><h4>Chưa có đề thi nào</h4></div>';
                return;
            }

            const filtered = exams.filter(exam => {
                const title = String(exam.title || '').toLowerCase();
                const typeLabel = getTypeLabel(exam.type);
                const matchKeyword = title.includes(examSearchKeyword);
                const matchType = examTypeFilter === 'all' || typeLabel === examTypeFilter;
                return matchKeyword && matchType;
            });

            if (!filtered.length) {
                list.innerHTML = '<div class="exam-card"><h4>Không tìm thấy bài thi phù hợp</h4></div>';
                return;
            }

            list.innerHTML = filtered.map(exam => `
                <div class="exam-card">
                    <h4>${toText(exam.title || '')}</h4>
                    <p class="quiz-type">Loại: ${toText(getTypeLabel(exam.type))}</p>
                    <div class="exam-meta">
                        <p>Số câu: ${exam.question_count ?? exam.questionsCount ?? '?'}</p>
                        <p>Thời gian: ${exam.time || 5} phút</p>
                    </div>
                    <button class="btn btn-primary" style="width:100%" onclick="startExam(${exam.id})">
                        Bắt Đầu Làm Bài
                    </button>
                </div>
            `).join('');
        } catch (err) {
            list.innerHTML = '<div class="exam-card"><h4>Lỗi nạp dữ liệu danh sách đề</h4></div>';
        }
    };

    window.startExam = async (id) => {
        try {
            const res = await fetch(`${window.API_BASE}/examdetail?id=${id}`);
            if (!res.ok) return alert("Không tìm thấy đề thi!");

            const data = await res.json();
            window.currentExam = data;
            window.currentQuestions = data.questions || [];
            window.userAnswers = {};

            if (!window.currentQuestions.length) {
                alert("Không có câu hỏi");
                return;
            }

            const container = document.getElementById('questions-container');
            if (!container) return;

            container.innerHTML = window.currentQuestions.map((q, qIdx) => {
                const options = (q.choices || []).map((c, cIdx) => `
                    <label class="option-label" id="label-${qIdx}-${cIdx}">
                        <input type="radio" name="q${qIdx}" onchange="selectAnswer(${qIdx}, ${cIdx})">
                        ${toText(c.content || '')}
                    </label>
                `).join('');

                return `
                    <div class="question-card">
                        <div class="question-title">Câu ${qIdx + 1}: ${toText(q.content || '')}</div>
                        <div class="options-group">${options}</div>
                    </div>
                `;
            }).join('');

            const titleEl = document.getElementById('quiz-title');
            if (titleEl) titleEl.innerText = data.title || 'Bài thi';

            window.showStudentPage('quiz-page');
            attachSubmitButton();
            startTimer((parseInt(data.time, 10) || 10) * 60);
        } catch (err) {
            alert("Lỗi tải chi tiết đề thi!");
        }
    };

    window.selectAnswer = (qIdx, cIdx) => {
        window.userAnswers[qIdx] = cIdx;
        document.querySelectorAll(`input[name="q${qIdx}"]`).forEach(input => {
            if (input.parentElement) input.parentElement.classList.remove('selected');
        });
        const label = document.getElementById(`label-${qIdx}-${cIdx}`);
        if (label) label.classList.add('selected');
    };

    function attachSubmitButton() {
        const btn = document.getElementById("btn-submit-quiz");
        if (!btn || !btn.parentNode) return;
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener("click", () => {
            window.submitQuiz();
        });
    }

    window.submitQuiz = async () => {
        if (!window.currentExam) {
            alert("Chưa có bài thi!");
            return;
        }
        if (!confirm("Bạn có chắc muốn nộp bài?")) return;

        const answers = window.currentQuestions.map((q, i) => {
            const chosenIdx = window.userAnswers[i];
            return {
                question_id: q.id,
                choice_id: (chosenIdx != null && q.choices?.[chosenIdx]) ? q.choices[chosenIdx].id : null
            };
        }).filter(a => a.choice_id !== null);

        const userId = (window.currentUser && window.currentUser.id) ? window.currentUser.id : null;
        if (!userId) {
            alert("Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại!");
            return;
        }

        try {
            const res = await fetch(`${window.API_BASE}/submitexam/${window.currentExam.id}/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId, answers })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText);
            }

            const result = await res.json();
            const total = result.total || window.currentQuestions.length;

            const scoreElement = document.getElementById("score-text");
            if (scoreElement) scoreElement.innerText = ((result.score / total) * 10).toFixed(1);

            const scoreDetail = document.getElementById("score-detail");
            if (scoreDetail) scoreDetail.innerText = `Đúng ${result.score}/${total} câu`;

            const correctEl = document.getElementById('stat-correct');
            const wrongEl = document.getElementById('stat-wrong');
            const skipEl = document.getElementById('stat-skip');
            if (correctEl) correctEl.innerText = result.score;
            if (wrongEl) wrongEl.innerText = total - result.score;
            if (skipEl) skipEl.innerText = window.currentQuestions.length - total;

            renderResultDetail(result);
            window.showStudentPage("result-page");
            if (window.timerInterval) clearInterval(window.timerInterval);
        } catch (e) {
            alert("Không thể nộp bài: " + e.message);
        }
    };

    function renderResultDetail(result) {
        const container = document.getElementById('result-detail-container') || document.getElementById('review-container');
        if (!container) return;

        const correctMap = result.correct_answers || {};
        container.innerHTML = window.currentQuestions.map((q, qIdx) => {
            const chosenIdx = window.userAnswers[qIdx];
            const chosenChoice = (chosenIdx != null) ? q.choices[chosenIdx] : null;
            const chosenId = chosenChoice ? chosenChoice.id : null;
            const correctId = correctMap[q.id] || null;

            const choicesHtml = (q.choices || []).map(c => {
                let cls = 'unselected';
                let icon = '';

                if (correctId) {
                    if (c.id === correctId && c.id === chosenId) {
                        cls = 'correct';
                        icon = '<span class="result-badge badge-correct">✓ Đúng</span>';
                    } else if (c.id === correctId) {
                        cls = 'correct';
                        icon = '<span class="result-badge badge-correct">✓ Đáp án đúng</span>';
                    } else if (c.id === chosenId) {
                        cls = 'wrong';
                        icon = '<span class="result-badge badge-wrong">✗ Bạn chọn</span>';
                    }
                } else if (c.id === chosenId) {
                    cls = 'correct';
                    icon = '<span class="result-badge badge-correct">✓ Đã chọn</span>';
                }

                return `<span class="result-choice ${cls}">${toText(c.content || '')}${icon}</span>`;
            }).join('');

            let questionBadge = '';
            if (!chosenId) {
                questionBadge = '<span class="result-badge badge-skip">Bỏ qua</span>';
            } else if (correctId) {
                questionBadge = chosenId === correctId
                    ? '<span class="result-badge badge-correct">Đúng</span>'
                    : '<span class="result-badge badge-wrong">Sai</span>';
            }

            return `
                <div class="result-question">
                    <p>Câu ${qIdx + 1}: ${toText(q.content || '')} ${questionBadge}</p>
                    ${choicesHtml}
                </div>
            `;
        }).join('');
    }

    function startTimer(seconds) {
        if (window.timerInterval) clearInterval(window.timerInterval);
        const timerDisplay = document.getElementById('time-left');

        window.timerInterval = setInterval(() => {
            seconds--;
            if (timerDisplay) {
                const m = Math.floor(seconds / 60).toString().padStart(2, '0');
                const s = (seconds % 60).toString().padStart(2, '0');
                timerDisplay.innerText = `${m}:${s}`;
            }
            if (seconds <= 0) {
                clearInterval(window.timerInterval);
                alert("Hết giờ làm bài!");
                window.submitQuiz();
            }
        }, 1000);
    }

    const backBtn = document.getElementById('btn-back-home');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.showStudentPage('home-page');
        });
    }

})();
