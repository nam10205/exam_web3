const API_BASE = "http://127.0.0.1:8000/api";

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

    document.getElementById('auth-switch-text').innerText =
        isLoginMode ? 'Chưa có tài khoản?' : 'Đã có tài khoản?';

    authSwitchLink.innerText = isLoginMode ? 'Đăng ký' : 'Đăng nhập';

    authError.innerText = '';
});


document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value;

    authError.innerText = '';

    if (isLoginMode) {
        try {
            // ===== LOGIN =====
            const res = await fetch(
                `${API_BASE}/login/?username=${user}&pwd=${pass}`
            );

            const data = await res.json();

            if (!res.ok) {
                authError.innerText = data.error || 'Sai tài khoản hoặc mật khẩu!';
                return;
            }

            // ===== LẤY USER DETAIL =====
            const userRes = await fetch(`${API_BASE}/getuserdetail/?username=${user}`);
            const userData = await userRes.json();

            if (!userRes.ok) {
                authError.innerText = "Không lấy được thông tin user!";
                return;
            }

            // ===== ADMIN =====
            if (userData.username === 'admin') {
                document.getElementById('auth-page').classList.remove('active');
                document.getElementById('student-layout').style.display = 'none';

                const admin = document.getElementById('admin-layout');
                admin.style.display = 'flex';

                showAdminPage('admin-dashboard');
                return;
            }

            // ===== STUDENT =====
            currentUser = {
                id: userData.id,
                username: userData.username,
                name: userData.name
            };

            document.getElementById('display-name').innerText =
                `Sinh viên: ${currentUser.name}`;

            document.getElementById('auth-page').classList.remove('active');
            document.getElementById('admin-layout').style.display = 'none';
            document.getElementById('student-layout').style.display = 'block';

            showStudentPage('home-page');
            renderStudentExams();

        } catch (err) {
            console.error("LỖI FETCH:", err);
            authError.innerText = 'Không kết nối được server!';
        }

    } else {
        // ===== REGISTER =====
        const repass = document.getElementById('re-password').value;
        const studentId = document.getElementById('reg-id').value.trim();
        const studentName = document.getElementById('reg-name').value.trim();

        if (!studentId || !studentName || !user || !pass) {
            authError.innerText = 'Nhập đầy đủ thông tin!';
            return;
        }

        if (pass !== repass) {
            authError.innerText = 'Mật khẩu không khớp!';
            return;
        }

        try {
            const res = await fetch(
                `${API_BASE}/signup/?id=${studentId}&name=${studentName}&username=${user}&pwd=${pass}`,
                { method: 'POST' }
            );

            const data = await res.json();

            if (!res.ok) {
                authError.innerText = data.error || 'Đăng ký thất bại!';
                return;
            }

            alert('Đăng ký thành công!');
            authSwitchLink.click();
            document.getElementById('username').value = user;

        } catch (err) {
            authError.innerText = 'Không kết nối được server!';
        }
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
