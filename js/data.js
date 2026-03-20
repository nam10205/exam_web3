// data.js - Data structures and constants
let EXAMS = [];

let QUESTIONS_DB = {};

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