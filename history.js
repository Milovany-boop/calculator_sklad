(function() {
  const currentUserRaw = sessionStorage.getItem('currentUser');
  if (!currentUserRaw) {
    window.location.href = 'login.html';
    return;
  }
  const currentUser = JSON.parse(currentUserRaw);
  document.getElementById('historyUsername').innerText = currentUser.username;

  let allShifts = [];

  function loadUserShifts() {
    const users = JSON.parse(localStorage.getItem('warehouse_users')) || [];
    const user = users.find(u => u.username === currentUser.username);
    return user ? (user.shifts || []) : [];
  }

  function renderShifts(filterMonth = null) {
    const container = document.getElementById('shiftsList');
    let shifts = [...allShifts];
    if (filterMonth) {
      shifts = shifts.filter(s => s.date.startsWith(filterMonth));
    }
    if (shifts.length === 0) {
      container.innerHTML = '<div class="shift-card">Нет смен за выбранный период</div>';
      return;
    }
    // сортировка по дате (новые сверху)
    shifts.sort((a,b) => new Date(b.date) - new Date(a.date));
    container.innerHTML = '';
    shifts.forEach((shift, idx) => {
      const div = document.createElement('div');
      div.className = 'shift-card';
      div.innerHTML = `
        <div><strong>📅 ${shift.date}</strong></div>
        <div>💰 Сумма смены: ${shift.totalSalary.toFixed(2)} ₽</div>
        <div>📦 Тара: ${shift.container.checked ? `${shift.container.qty} шт × ${shift.container.tariff}₽` : 'нет'}</div>
        <button class="delete-shift" data-idx="${idx}" data-date="${shift.date}">🗑️ Удалить</button>
      `;
      container.appendChild(div);
    });
    // обработка удаления
    document.querySelectorAll('.delete-shift').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dateToDelete = btn.getAttribute('data-date');
        const originalIndex = allShifts.findIndex(s => s.date === dateToDelete && s.totalSalary === parseFloat(btn.parentElement.querySelector('div:nth-child(2)').innerText.split(':')[1].trim()));
        // более надёжно: ищем смену с такой датой и такой же суммой (можно по индексу в отфильтрованном, но лучше по оригиналу)
        const shiftToDelete = allShifts.find((s, i) => s.date === dateToDelete && s.totalSalary === shift.totalSalary);
        if (shiftToDelete && confirm('Удалить эту смену?')) {
          const users = JSON.parse(localStorage.getItem('warehouse_users'));
          const userIdx = users.findIndex(u => u.username === currentUser.username);
          const shiftIdx = users[userIdx].shifts.findIndex(s => s.date === shiftToDelete.date && s.totalSalary === shiftToDelete.totalSalary);
          if (shiftIdx !== -1) {
            users[userIdx].shifts.splice(shiftIdx, 1);
            localStorage.setItem('warehouse_users', JSON.stringify(users));
            loadAndRender(); 
          }
        }
      });
    });
  }

  function loadAndRender() {
    allShifts = loadUserShifts();
    const monthFilter = document.getElementById('monthFilter').value;
    renderShifts(monthFilter);
  }

  document.getElementById('applyFilterBtn').addEventListener('click', () => {
    const month = document.getElementById('monthFilter').value;
    renderShifts(month);
  });
  document.getElementById('resetFilterBtn').addEventListener('click', () => {
    document.getElementById('monthFilter').value = '2026-05';
    renderShifts('2026-05');
  });
  document.getElementById('logoutHistoryBtn').addEventListener('click', () => {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  });

  loadAndRender();
})();