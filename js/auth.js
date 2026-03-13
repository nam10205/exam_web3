// auth.js - Authentication logic
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
        const repass = document.getElementById('re-password').value;
        const studentId = document.getElementById('reg-id').value.trim();
        const studentName = document.getElementById('reg-name').value.trim();

        if (!studentId || !studentName || !user || !pass) return authError.innerText = 'Vui lòng điền đủ thông tin!';
        if (pass !== repass) return authError.innerText = 'Mật khẩu xác nhận không khớp!';
        if (USERS_DB.some(u => u.username === user)) return authError.innerText = 'Tên đăng nhập đã tồn tại!';

        USERS_DB.push({ id: studentId, name: studentName, username: user, password: pass, attempts: 0 });
        alert('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.');

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