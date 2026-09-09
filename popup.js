const statusEl = document.getElementById('status');
const cookieArea = document.getElementById('cookieArea');

function showStatus(msg, type = 'success') {
  statusEl.textContent = msg;
  statusEl.className = `status ${type}`;
}

// ========== LẤY COOKIE ==========
document.getElementById('getBtn').addEventListener('click', async () => {
  try {
    const cookies = await chrome.cookies.getAll({ domain: '.facebook.com' });

    if (cookies.length === 0) {
      showStatus('Không tìm thấy cookie. Hãy đăng nhập Facebook trước!', 'error');
      return;
    }

    // Chuyển thành chuỗi cookie chuẩn
    const cookieString = cookies
      .map(c => `${c.name}=${c.value}`)
      .join('; ');

    cookieArea.value = cookieString;
    showStatus(`Đã lấy ${cookies.length} cookie thành công!`);
  } catch (err) {
    showStatus('Lỗi: ' + err.message, 'error');
  }
});

// ========== IMPORT COOKIE ==========
document.getElementById('importBtn').addEventListener('click', async () => {
  const raw = cookieArea.value.trim();
  if (!raw) {
    showStatus('Hãy dán cookie vào ô trước!', 'error');
    return;
  }

  try {
    // Xóa cookie cũ trước khi import
    const oldCookies = await chrome.cookies.getAll({ domain: '.facebook.com' });
    for (const c of oldCookies) {
      await chrome.cookies.remove({
        url: `https://${c.domain.startsWith('.') ? c.domain.slice(1) : c.domain}${c.path}`,
        name: c.name
      });
    }

    // Parse chuỗi cookie
    const pairs = raw.split(';').map(s => s.trim()).filter(Boolean);

    for (const pair of pairs) {
      const eqIndex = pair.indexOf('=');
      if (eqIndex === -1) continue;

      const name = pair.substring(0, eqIndex).trim();
      const value = pair.substring(eqIndex + 1).trim();

      await chrome.cookies.set({
        url: 'https://www.facebook.com',
        name: name,
        value: value,
        domain: '.facebook.com',
        path: '/',
        secure: true,
        httpOnly: name === 'xs' || name === 'c_user' // một số cookie quan trọng
      });
    }

    showStatus('Import thành công! Đang mở Facebook...');
    
    // Mở tab Facebook
    chrome.tabs.create({ url: 'https://www.facebook.com' });
  } catch (err) {
    showStatus('Lỗi import: ' + err.message, 'error');
  }
});

// ========== XÓA COOKIE ==========
document.getElementById('clearBtn').addEventListener('click', async () => {
  try {
    const cookies = await chrome.cookies.getAll({ domain: '.facebook.com' });
    for (const c of cookies) {
      await chrome.cookies.remove({
        url: `https://${c.domain.startsWith('.') ? c.domain.slice(1) : c.domain}${c.path}`,
        name: c.name
      });
    }
    cookieArea.value = '';
    showStatus(`Đã xóa ${cookies.length} cookie.`);
  } catch (err) {
    showStatus('Lỗi: ' + err.message, 'error');
  }
});