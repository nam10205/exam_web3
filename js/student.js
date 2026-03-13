// student.js - Student interface functions
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