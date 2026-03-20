window.API_BASE = "http://127.0.0.1:8000/api";
window.currentUser = null;
window.isLoginMode = true;

(function initAuth() {
    const authForm = document.getElementById('auth-form');
    if (!authForm) {
        setTimeout(initAuth, 50);
        return;
    }

    const authSwitchLink = document.getElementById('auth-switch-link');
    const authTitle = document.getElementById('auth-title');
    const authSubmitBtn = document.getElementById('btn-submit');
    const authError = document.getElementById('auth-error');

    if (authSwitchLink) {
        authSwitchLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.isLoginMode = !window.isLoginMode;

            const regFields = document.getElementById('register-fields');
            const regPass = document.getElementById('register-password-field');
            if (regFields) regFields.style.display = window.isLoginMode ? 'none' : 'block';
            if (regPass) regPass.style.display = window.isLoginMode ? 'none' : 'block';

            if (authTitle) authTitle.innerText = window.isLoginMode ? 'Đăng Nhập' : 'Đăng Ký Tài Khoản';
            if (authSubmitBtn) authSubmitBtn.innerText = window.isLoginMode ? 'Đăng Nhập' : 'Đăng Ký';

            const switchText = document.getElementById('auth-switch-text');
            if (switchText) switchText.innerText = window.isLoginMode ? 'Chưa có tài khoản?' : 'Đã có tài khoản?';
            authSwitchLink.innerText = window.isLoginMode ? 'Đăng ký' : 'Đăng nhập';
            authError.innerText = '';
        });
    }

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const user = document.getElementById('username').value.trim();
        const pass = document.getElementById('password').value;
        authError.innerText = '';

        if (window.isLoginMode) {
            try {
                const res = await fetch(`${window.API_BASE}/login/?username=${user}&pwd=${pass}`);
                const data = await res.json();

                if (!res.ok) {
                    authError.innerText = data.error || 'Sai tài khoản hoặc mật khẩu!';
                    return;
                }

                const userRes = await fetch(`${window.API_BASE}/getuserdetail/?username=${user}`);
                const userData = await userRes.json();

                if (!userRes.ok) {
                    authError.innerText = "Không lấy được thông tin user!";
                    return;
                }

                if (userData.username === 'admin') {
                    document.getElementById('auth-page').classList.remove('active');
                    document.getElementById('student-layout').style.display = 'none';
                    document.getElementById('admin-layout').style.display = 'flex';
                    if (typeof showAdminPage === 'function') showAdminPage('admin-dashboard');
                    return;
                }

                window.currentUser = {
                    id: userData.id,
                    username: userData.username,
                    name: userData.name
                };

                const displayName = document.getElementById('display-name');
                if (displayName) displayName.innerText = `Sinh viên: ${window.currentUser.name}`;

                document.getElementById('auth-page').classList.remove('active');
                const adminLayout = document.getElementById('admin-layout');
                if (adminLayout) adminLayout.style.display = 'none';
                document.getElementById('student-layout').style.display = 'block';

                if (typeof showStudentPage === 'function') showStudentPage('home-page');
                if (typeof renderStudentExams === 'function') renderStudentExams();

            } catch (err) {
                authError.innerText = 'Không kết nối được server!';
            }

        } else {
            const repass = document.getElementById('re-password') ? document.getElementById('re-password').value : '';
            const studentId = document.getElementById('reg-id') ? document.getElementById('reg-id').value.trim() : '';
            const studentName = document.getElementById('reg-name') ? document.getElementById('reg-name').value.trim() : '';

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
                    `${window.API_BASE}/signup/?id=${studentId}&name=${studentName}&username=${user}&pwd=${pass}`,
                    { method: 'POST' }
                );
                const data = await res.json();

                if (!res.ok) {
                    authError.innerText = data.error || 'Đăng ký thất bại!';
                    return;
                }

                alert('Đăng ký thành công!');
                if (authSwitchLink) authSwitchLink.click();
                document.getElementById('username').value = user;

            } catch (err) {
                authError.innerText = 'Không kết nối được server!';
            }
        }
    });

    document.querySelectorAll('.btn-logout').forEach(btn => {
        btn.addEventListener('click', () => {
            window.currentUser = null;
            authForm.reset();
            document.getElementById('student-layout').style.display = 'none';
            const adminLayout = document.getElementById('admin-layout');
            if (adminLayout) adminLayout.style.display = 'none';
            document.getElementById('auth-page').classList.add('active');
            if (typeof timerInterval !== 'undefined') clearInterval(timerInterval);
        });
    });
})();
