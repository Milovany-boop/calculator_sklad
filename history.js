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

  // Формирование строки с активными секциями
  function getActiveSectionsText(sections) {
    const active = [];
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].qty > 0) {
        active.push(`Секция ${i+1}: ${sections[i].qty} шт × ${sections[i].tariff}₽ = ${(sections[i].qty * sections[i].tariff).toFixed(2)}₽`);
      }
    }
    if (active.length === 0) return '— нет работы в секциях —';
    return active.join('; ');
  }

  function renderShifts(filterMonth = null) {
    const container = document.getElementById('shiftsList');
    let shifts = [...allShifts];
    if (filterMonth) {
      shifts = shifts.filter(s => s.date.startsWith(filterMonth));
    }
    if (shifts.length === 0) {
      container.innerHTML = '<div class="shift-card">📭 Нет смен за выбранный период</div>';
      return;
    }
    shifts.sort((a,b) => new Date(b.date) - new Date(a.date));
    container.innerHTML = '';
    shifts.forEach((shift, idx) => {
      const activeSections = getActiveSectionsText(shift.sections);
      const div = document.createElement('div');
      div.className = 'shift-card';
      div.innerHTML = `
        <div><strong>📅 ${shift.date}</strong></div>
        <div>💰 Сумма смены: ${shift.totalSalary.toFixed(2)} ₽</div>
        <div>➕ Базовая доплата: ${shift.baseBonus} ₽</div>
        <div>📦 Тара: ${shift.containerQty > 0 ? `${shift.containerQty} шт × ${shift.containerTariff}₽ = ${(shift.containerQty * shift.containerTariff).toFixed(2)}₽` : 'нет'}</div>
        <div>🔧 Штучки: ${shift.piecesQty > 0 ? `${shift.piecesQty} шт × ${shift.piecesTariff}₽ = ${(shift.piecesQty * shift.piecesTariff).toFixed(2)}₽` : 'нет'}</div>
        <div class="sections-detail">📌 <strong>Работал в:</strong> ${activeSections}</div>
        <button class="delete-shift" data-idx="${idx}" data-date="${shift.date}">🗑️ Удалить</button>
      `;
      container.appendChild(div);
    });

    // Удаление смены
    document.querySelectorAll('.delete-shift').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dateToDelete = btn.getAttribute('data-date');
        const shiftCard = btn.closest('.shift-card');
        const totalStr = shiftCard.querySelector('div:nth-child(2)').innerText.split(':')[1].trim();
        const totalValue = parseFloat(totalStr);
        const shiftToDelete = allShifts.find(s => s.date === dateToDelete && Math.abs(s.totalSalary - totalValue) < 0.01);
        if (shiftToDelete && confirm('Удалить эту смену?')) {
          const users = JSON.parse(localStorage.getItem('warehouse_users'));
          const userIdx = users.findIndex(u => u.username === currentUser.username);
          const shiftIdx = users[userIdx].shifts.findIndex(s => s.date === shiftToDelete.date && Math.abs(s.totalSalary - shiftToDelete.totalSalary) < 0.01);
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