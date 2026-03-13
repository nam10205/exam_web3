// data.js - Data structures and constants
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

// Global state variables
let currentUser = null;
let currentExam = null;
let currentQuestions = [];
let userAnswers = {};
let timerInterval;
let timeLeft = 0;
let isLoginMode = true;
let chartInstance = null;