
function showStudentPage(pageId) {
    document.querySelectorAll('#student-layout .page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function renderStudentExams() {
    const list = document.getElementById('exam-list');
    list.innerHTML = '';


    list.innerHTML = `
        <div class="exam-card">
            <h4>Demo Quiz từ Server</h4>
            <div class="exam-meta">
                <p>Số câu: ?</p>
                <p>Thời gian: 5 phút</p>
            </div>
            <button class="btn btn-primary" style="width:100%" onclick="startExam(1)">
                Bắt Đầu Làm Bài
            </button>
        </div>
    `;
}


function startExam(id) {
    fetch(`${API_BASE}/examdetail?id=${id}`)
        .then(res => res.json())
        .then(data => {
            currentExam = data;
            currentQuestions = data.questions || [];

            if (currentQuestions.length === 0) {
                alert("Không có câu hỏi");
                return;
            }

            userAnswers = {};

            document.getElementById('quiz-title').innerText = data.title;

            const container = document.getElementById('questions-container');
            container.innerHTML = '';

            currentQuestions.forEach((q, qIndex) => {
                let optionsHtml = '';

                q.choices.forEach((opt, oIndex) => {
                    optionsHtml += `
                        <label class="option-label" id="label-${qIndex}-${oIndex}">
                            <input type="radio" name="q${qIndex}"
                                onchange="selectAnswer(${qIndex}, ${oIndex})">
                            ${toText(opt.content)}
                        </label>
                    `;
                });

                container.innerHTML += `
                    <div class="question-card">
                        <div class="question-title">
                            Câu ${qIndex + 1}: ${toText(q.content)}
                        </div>
                        <div class="options-group">${optionsHtml}</div>
                    </div>
                `;
            });

            showStudentPage('quiz-page');

            // timer
            timeLeft = 5 * 60;
            updateTimerUI();
            clearInterval(timerInterval);

            timerInterval = setInterval(() => {
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    alert("Hết giờ!");
                    submitQuiz();
                } else {
                    timeLeft--;
                    updateTimerUI();
                }
            }, 1000);
        })
        .catch(() => alert("Không load được bài thi"));
}


function selectAnswer(qIndex, oIndex) {
    userAnswers[qIndex] = oIndex;

    document.querySelectorAll(`input[name="q${qIndex}"]`)
        .forEach(r => r.parentElement.classList.remove('selected'));

    document.getElementById(`label-${qIndex}-${oIndex}`)
        .classList.add('selected');
}


function updateTimerUI() {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('time-left').innerText = `${m}:${s}`;
}


document.getElementById('btn-submit-quiz').addEventListener('click', () => {
    if (confirm('Bạn muốn nộp bài chứ?')) {
        clearInterval(timerInterval);
        submitQuiz();
    }
});

function submitQuiz() {
    if (!currentUser) {
        alert("Chưa đăng nhập");
        return;
    }

    const answers = [];

    currentQuestions.forEach((q, i) => {
        if (userAnswers[i] !== undefined) {
            answers.push({
                question_id: q.id,
                choice_id: q.choices[userAnswers[i]].id
            });
        }
    });

    fetch(`${API_BASE}/submitexam/${currentExam.id}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user_id: currentUser.id,
            answers: answers
        })
    })
        .then(res => res.json())
        .then(data => {
            console.log(data);

            if (data.error) {
                alert(data.error);
                return;
            }

            document.getElementById('score-text').innerText =
                `${((data.score / data.total) * 10).toFixed(1)}`;

            document.getElementById('stat-correct').innerText = data.score;
            document.getElementById('stat-wrong').innerText = data.total - data.score;
            document.getElementById('stat-skip').innerText =
                currentQuestions.length - data.total;

            showStudentPage('result-page');
        })
        .catch(() => alert("Lỗi gửi bài"));
}


document.getElementById('btn-back-home').addEventListener('click', () => {
    showStudentPage('home-page');
});
