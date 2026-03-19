(function () {

    window.currentExam = null;
    window.currentQuestions = [];
    window.userAnswers = {};
    window.timerInterval = null;

    window.showStudentPage = (pageId) => {
        document.querySelectorAll('#student-layout .page')
            .forEach(p => p.classList.remove('active'));
        const target = document.getElementById(pageId);
        if (target) target.classList.add('active');
    };

    // Chuyển type số -> nhãn hiển thị
    function getTypeLabel(type) {
        const map = {
            0: 'Trắc nghiệm',
            1: 'Trắc nghiệm',
            2: 'Tự luận',
            3: 'Hỗn hợp',
        };
        return map[type] || 'Trắc nghiệm';
    }

    // 1. Load danh sách đề thi
    window.renderStudentExams = async () => {
        const list = document.getElementById('exam-list');
        if (!list) return;
        try {
            const res = await fetch(`${window.API_BASE}/exams/`);
            const exams = await res.json();
            if (!exams.length) {
                list.innerHTML = '<p>Chưa có đề thi nào.</p>';
                return;
            }
            list.innerHTML = exams.map(exam => `
                <div class="exam-card">
                    <h4>${exam.title}</h4>
                    <p style="color:#888; font-size:13px;">
                        <i class="fas fa-tag"></i> ${getTypeLabel(exam.type)}
                    </p>
                    <button class="btn btn-primary" style="width:100%"
                        onclick="startExam(${exam.id})">
                        Vào thi
                    </button>
                </div>
            `).join('');
        } catch (err) {
            console.error("Lỗi nạp danh sách:", err);
            list.innerHTML = "Lỗi nạp dữ liệu danh sách đề!";
        }
    };

    // 2. Bắt đầu thi
    window.startExam = async (id) => {
        try {
            const res = await fetch(`${window.API_BASE}/examdetail?id=${id}`);
            if (!res.ok) return alert("Không tìm thấy đề thi!");

            const data = await res.json();
            window.currentExam = data;
            window.currentQuestions = data.questions || [];
            window.userAnswers = {};

            const container = document.getElementById('questions-container');
            if (!container) return;

            container.innerHTML = window.currentQuestions.map((q, qIdx) => `
                <div class="question-card" style="margin-bottom:15px; padding:15px; border:1px solid #ddd; border-radius:8px;">
                    <p><b>Câu ${qIdx + 1}:</b> ${q.content}</p>
                    <div class="options-group">
                        ${q.choices.map((c, cIdx) => `
                            <label id="label-${qIdx}-${cIdx}"
                                style="display:block; margin:8px 0; cursor:pointer;">
                                <input type="radio"
                                    name="q${qIdx}"
                                    onchange="selectAnswer(${qIdx}, ${cIdx})">
                                ${c.content}
                            </label>
                        `).join('')}
                    </div>
                </div>
            `).join('');

            const titleEl = document.getElementById('quiz-title');
            if (titleEl) titleEl.innerText = data.title || 'Bài thi';

            window.showStudentPage('quiz-page');
            attachSubmitButton();
            startTimer(10 * 60);

        } catch (err) {
            console.error("Lỗi nạp chi tiết:", err);
            alert("Lỗi tải chi tiết đề thi!");
        }
    };

    // 3. Chọn đáp án
    window.selectAnswer = (qIdx, cIdx) => {
        window.userAnswers[qIdx] = cIdx;
        document.querySelectorAll(`input[name="q${qIdx}"]`).forEach(i => {
            if (i.parentElement) {
                i.parentElement.style.fontWeight = "normal";
                i.parentElement.style.color = "black";
            }
        });
        const label = document.getElementById(`label-${qIdx}-${cIdx}`);
        if (label) {
            label.style.fontWeight = "bold";
            label.style.color = "#007bff";
        }
    };

    // 4. Gắn nút nộp bài mỗi lần vào thi
    function attachSubmitButton() {
        const btn = document.getElementById("btn-submit-quiz");
        if (!btn) {
            console.warn("[Student] Không tìm thấy btn-submit-quiz");
            return;
        }
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener("click", window.submitQuiz);
        console.log("[Student] Đã gắn nút nộp bài");
    }

    // 5. Nộp bài
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
                choice_id: (chosenIdx != null && q.choices?.[chosenIdx])
                    ? q.choices[chosenIdx].id
                    : null
            };
        }).filter(a => a.choice_id !== null);

        const userId = (window.currentUser && window.currentUser.id)
            ? window.currentUser.id
            : null;

        if (!userId) {
            alert("Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại!");
            return;
        }

        try {
            console.log("[Student] Nộp bài exam ID:", window.currentExam.id, "user:", userId);

            const res = await fetch(
                `${window.API_BASE}/submitexam/${window.currentExam.id}/`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id: userId, answers })
                }
            );

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText);
            }

            const result = await res.json();
            console.log("[Student] Kết quả:", result);

            const total = result.total || window.currentQuestions.length;
            const scoreElement = document.getElementById("score-text");
            if (scoreElement) {
                scoreElement.innerText = ((result.score / total) * 10).toFixed(1);
            }
            const scoreDetail = document.getElementById("score-detail");
            if (scoreDetail) {
                scoreDetail.innerText = `Đúng ${result.score}/${total} câu`;
            }

            renderResultDetail(result);
            window.showStudentPage("result-page");
            if (window.timerInterval) clearInterval(window.timerInterval);

        } catch (e) {
            console.error("[Student] Lỗi nộp bài:", e);
            alert("Không thể nộp bài: " + e.message);
        }
    };

    // 6. Render chi tiết đáp án
    function renderResultDetail(result) {
        const container = document.getElementById('result-detail-container');
        if (!container) return;

        const correctMap = result.correct_answers || {};

        container.innerHTML = window.currentQuestions.map((q, qIdx) => {
            const chosenIdx = window.userAnswers[qIdx];
            const chosenChoice = (chosenIdx != null) ? q.choices[chosenIdx] : null;
            const chosenId = chosenChoice ? chosenChoice.id : null;
            const correctId = correctMap[q.id] || null;

            const choicesHtml = q.choices.map(c => {
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
                } else {
                    if (c.id === chosenId) {
                        cls = 'correct';
                        icon = '<span class="result-badge badge-correct">✓ Đã chọn</span>';
                    }
                }

                return `<span class="result-choice ${cls}">${c.content}${icon}</span>`;
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
                    <p>Câu ${qIdx + 1}: ${q.content} ${questionBadge}</p>
                    ${choicesHtml}
                </div>
            `;
        }).join('');
    }

    // 7. Timer
    function startTimer(s) {
        if (window.timerInterval) clearInterval(window.timerInterval);
        const timerDisplay = document.getElementById('time-left');
        window.timerInterval = setInterval(() => {
            s--;
            if (timerDisplay) {
                const m = Math.floor(s / 60);
                const sec = s % 60;
                timerDisplay.innerText = `${m}:${sec < 10 ? '0' : ''}${sec}`;
            }
            if (s <= 0) {
                clearInterval(window.timerInterval);
                alert("Hết giờ làm bài!");
                window.submitQuiz();
            }
        }, 1000);
    }

})();