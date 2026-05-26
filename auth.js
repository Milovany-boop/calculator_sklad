(function() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');

  function switchTab(active) {
    if (active === 'login') {
      loginForm.classList.add('active');
      registerForm.classList.remove('active');
      loginTab.classList.add('active');
      registerTab.classList.remove('active');
    } else {
      registerForm.classList.add('active');
      loginForm.classList.remove('active');
      registerTab.classList.add('active');
      loginTab.classList.remove('active');
    }
  }

  loginTab.addEventListener('click', () => switchTab('login'));
  registerTab.addEventListener('click', () => switchTab('register'));

  // Получение списка пользователей
  function getUsers() {
    const users = localStorage.getItem('warehouse_users');
    return users ? JSON.parse(users) : [];
  }

  function saveUsers(users) {
    localStorage.setItem('warehouse_users', JSON.stringify(users));
  }

  // Регистрация
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regPasswordConfirm').value;
    const errorDiv = document.getElementById('regError');

    if (!username || !password) {
      errorDiv.innerText = 'Заполните все поля';
      return;
    }
    if (password !== confirm) {
      errorDiv.innerText = 'Пароли не совпадают';
      return;
    }
    const users = getUsers();
    if (users.find(u => u.username === username)) {
      errorDiv.innerText = 'Пользователь уже существует';
      return;
    }
    users.push({
      username: username,
      password: password,
      shifts: []  // массив смен
    });
    saveUsers(users);
    errorDiv.innerText = 'Регистрация успешна! Теперь войдите.';
    setTimeout(() => switchTab('login'), 1200);
    registerForm.reset();
  });

  // Вход
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      errorDiv.innerText = 'Неверный логин или пароль';
      return;
    }
    // сохраняем текущего пользователя в sessionStorage
    sessionStorage.setItem('currentUser', JSON.stringify({ username: user.username }));
    window.location.href = 'index.html';
  });
})();