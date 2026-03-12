const DEFAULT_INVENTORY = [
  { 품목코드: "ING001", 재료명: "도우볼", 규격: "220g", 단위: "개", 현재재고: 120, 안전재고: 180, MOQ: 100, 거래처: "도미노푸드서플라이", 거래처이메일: "kutest6240@gmail.com" },
  { 품목코드: "ING002", 재료명: "토마토소스", 규격: "3kg", 단위: "팩", 현재재고: 32, 안전재고: 20, MOQ: 10, 거래처: "도미노푸드서플라이", 거래처이메일: "kutest6240@gmail.com" },
  { 품목코드: "ING003", 재료명: "모짜렐라치즈", 규격: "2kg", 단위: "봉", 현재재고: 12, 안전재고: 18, MOQ: 10, 거래처: "도미노푸드서플라이", 거래처이메일: "kutest6240@gmail.com" },
  { 품목코드: "ING004", 재료명: "페퍼로니", 규격: "1kg", 단위: "봉", 현재재고: 15, 안전재고: 12, MOQ: 8, 거래처: "프레시미트코리아", 거래처이메일: "kutest6240@gmail.com" },
  { 품목코드: "ING005", 재료명: "베이컨", 규격: "1kg", 단위: "팩", 현재재고: 6, 안전재고: 10, MOQ: 10, 거래처: "프레시미트코리아", 거래처이메일: "kutest6240@gmail.com" },
  { 품목코드: "ING006", 재료명: "양파", 규격: "2.5kg", 단위: "봉", 현재재고: 14, 안전재고: 12, MOQ: 6, 거래처: "그린베지유통", 거래처이메일: "kutest6240@gmail.com" },
  { 품목코드: "ING007", 재료명: "피망", 규격: "2.5kg", 단위: "봉", 현재재고: 5, 안전재고: 8, MOQ: 5, 거래처: "그린베지유통", 거래처이메일: "kutest6240@gmail.com" },
  { 품목코드: "ING008", 재료명: "양송이버섯", 규격: "2.5kg", 단위: "캔", 현재재고: 3, 안전재고: 6, MOQ: 6, 거래처: "그린베지유통", 거래처이메일: "kutest6240@gmail.com" },
  { 품목코드: "ING009", 재료명: "블랙올리브", 규격: "3kg", 단위: "캔", 현재재고: 9, 안전재고: 8, MOQ: 4, 거래처: "토핑솔루션", 거래처이메일: "kutest6240@gmail.com" },
  { 품목코드: "ING010", 재료명: "스위트콘", 규격: "3kg", 단위: "캔", 현재재고: 4, 안전재고: 5, MOQ: 6, 거래처: "토핑솔루션", 거래처이메일: "kutest6240@gmail.com" }
];

let inventoryData = JSON.parse(JSON.stringify(DEFAULT_INVENTORY));
let orderSendStatus = {};

const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:'))
  ? 'https://ordersystem-orcin.vercel.app'
  : '';

function renderInputTable() {
  const tbody = document.getElementById('invBody');
  const esc = v => String(v ?? '').replace(/"/g, '&quot;');
  tbody.innerHTML = inventoryData.map((item, idx) => `
    <tr>
      <td><input type="text" data-idx="${idx}" data-field="품목코드" value="${esc(item.품목코드)}"></td>
      <td><input type="text" data-idx="${idx}" data-field="재료명" value="${esc(item.재료명)}"></td>
      <td><input type="text" data-idx="${idx}" data-field="규격" value="${esc(item.규격)}"></td>
      <td><input type="text" data-idx="${idx}" data-field="단위" value="${esc(item.단위)}"></td>
      <td class="col-num"><input type="number" min="0" data-idx="${idx}" data-field="현재재고" value="${item.현재재고}"></td>
      <td class="col-num"><input type="number" min="0" data-idx="${idx}" data-field="안전재고" value="${item.안전재고}"></td>
      <td class="col-num"><input type="number" min="0" data-idx="${idx}" data-field="MOQ" value="${item.MOQ}"></td>
      <td><input type="text" data-idx="${idx}" data-field="거래처" value="${esc(item.거래처)}"></td>
      <td><input type="text" data-idx="${idx}" data-field="거래처이메일" value="${esc(item.거래처이메일)}"></td>
    </tr>
  `).join('');

  tbody.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      const field = e.target.dataset.field;
      const numFields = ['현재재고', '안전재고', 'MOQ'];
      const val = numFields.includes(field) ? (parseInt(e.target.value) || 0) : (e.target.value || '').trim();
      inventoryData[idx][field] = val;
    });
  });
}

function analyzeInventory() {
  return inventoryData.map(item => {
    const current = Number(item.현재재고) || 0;
    const safe = Number(item.안전재고) || 0;
    const moq = Number(item.MOQ) || 0;
    const shortage = Math.max(safe - current, 0);
    const needOrder = current < safe;
    const orderQty = needOrder ? Math.max(moq, shortage) : 0;
    const status = needOrder ? '발주 필요' : '정상';
    return { ...item, 부족수량: shortage, 발주권장수량: orderQty, 상태: status };
  });
}

function getOrdersBySupplier(analyzed) {
  const bySup = {};
  analyzed.filter(i => i.상태 === '발주 필요').forEach(item => {
    const sup = item.거래처 || '';
    if (!sup) return;
    if (!bySup[sup]) bySup[sup] = { 거래처: sup, 품목수: 0, 총발주수량: 0, 품목목록: [], 거래처이메일: item.거래처이메일 || '' };
    bySup[sup].품목수++;
    bySup[sup].총발주수량 += item.발주권장수량 || 0;
    bySup[sup].품목목록.push({
      재료명: item.재료명, 규격: item.규격, 단위: item.단위,
      현재재고: item.현재재고, 안전재고: item.안전재고, 발주권장수량: item.발주권장수량
    });
  });
  return Object.values(bySup);
}

function syncFromInputs() {
  const numFields = ['현재재고', '안전재고', 'MOQ'];
  document.querySelectorAll('#invBody input').forEach(inp => {
    const idx = parseInt(inp.dataset.idx);
    const field = inp.dataset.field;
    inventoryData[idx][field] = numFields.includes(field)
      ? (parseInt(inp.value) || 0)
      : (inp.value || '').trim();
  });
}

function getEmailContent(supplierName, storeName, items) {
  const d = new Date().toISOString().slice(0, 10);
  const subject = `[발주요청] ${storeName} / ${supplierName} / ${d}`;
  const lines = items.map(i => `- ${i.재료명} (${i.규격}): ${i.발주권장수량}${i.단위} (현재 ${i.현재재고}${i.단위}, 안전재고 ${i.안전재고}${i.단위})`).join('\n');
  const body = `안녕하세요 ${supplierName} 담당자님.

도미노피자 ${storeName}입니다.
아래 품목에 대해 발주 요청드립니다.

${lines}

첨부한 발주서 확인 부탁드립니다.
감사합니다.
점포 운영매니저`;
  return { subject, body };
}

function openEmailModal(data) {
  document.getElementById('storeName').value = '점포';
  document.getElementById('emailTo').value = data.email || '';
  document.getElementById('emailModal').dataset.supplier = data.supplier || '';
  document.getElementById('emailModal').dataset.itemsJson = JSON.stringify(data.items || []);
  updateEmailPreview();
  document.getElementById('emailModal').classList.add('active');
}

function updateEmailPreview() {
  const store = document.getElementById('storeName').value || '점포';
  const supplier = document.getElementById('emailModal').dataset.supplier || '';
  const items = JSON.parse(document.getElementById('emailModal').dataset.itemsJson || '[]');
  if (items.length === 0) return;
  const { subject, body } = getEmailContent(supplier, store, items);
  document.getElementById('emailSubject').value = subject;
  document.getElementById('emailBody').textContent = body;
}

function setOrderSendStatus(supplier, status) {
  orderSendStatus[supplier] = status;
  const card = document.querySelector(`.order-card[data-supplier="${CSS.escape(supplier)}"]`);
  if (card) {
    let badge = card.querySelector('.send-status');
    if (!badge) {
      badge = document.createElement('span');
      card.querySelector('.order-card-header').appendChild(badge);
    }
    badge.textContent = status === 'success' ? '발송성공' : '발송실패';
    badge.className = 'send-status ' + (status === 'success' ? 'send-success' : 'send-fail');
  }
}

async function doSendEmail() {
  const to = document.getElementById('emailTo').value.trim();
  const store = document.getElementById('storeName').value || '점포';
  const supplier = document.getElementById('emailModal').dataset.supplier || '';
  const items = JSON.parse(document.getElementById('emailModal').dataset.itemsJson || '[]');

  if (!to) {
    alert('수신 이메일을 입력해주세요.');
    return;
  }
  if (items.length === 0) return;

  const btn = document.getElementById('btnSendEmail');
  btn.disabled = true;
  btn.textContent = '발송 중...';

  try {
    const res = await fetch(`${API_BASE}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_email: to, supplier_name: supplier, store_name: store, items })
    });
    let data = {};
    try {
      data = await res.json();
    } catch (_) {
      data = { error: res.status === 404 ? 'API를 찾을 수 없습니다. Vercel에 배포되어 있는지 확인하세요.' : '응답 오류' };
    }

    const success = res.ok || res.status === 200 || data.success === true;
    if (success) {
      setOrderSendStatus(supplier, 'success');
      document.getElementById('emailModal').classList.remove('active');
    } else {
      setOrderSendStatus(supplier, 'fail');
      alert('발송 실패: ' + (data.error || '오류가 발생했습니다.'));
    }
  } catch (err) {
    setOrderSendStatus(supplier, 'fail');
    alert('발송 실패: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '이메일 보내기';
  }
}

document.getElementById('btnAnalyze').addEventListener('click', () => {
  syncFromInputs();
  orderSendStatus = {};
  const analyzed = analyzeInventory();
  const orders = getOrdersBySupplier(analyzed);
  const summary = {
    총품목수: analyzed.length,
    발주필요품목수: analyzed.filter(i => i.상태 === '발주 필요').length,
    전체권장발주수량: analyzed.reduce((s, i) => s + (i.발주권장수량 || 0), 0),
    오늘상태: analyzed.some(i => i.상태 === '발주 필요') ? '담당자 확인 필요' : '정상'
  };

  document.getElementById('mainGrid').style.display = 'block';
  document.getElementById('summaryGrid').innerHTML = `
    <div class="summary-item"><div class="value">${summary.총품목수}</div><div class="label">총 품목 수</div></div>
    <div class="summary-item ${summary.발주필요품목수 > 0 ? 'status-warning' : 'status-ok'}"><div class="value">${summary.발주필요품목수}</div><div class="label">발주 필요</div></div>
    <div class="summary-item"><div class="value">${summary.전체권장발주수량}</div><div class="label">권장 발주</div></div>
    <div class="summary-item ${summary.오늘상태 === '담당자 확인 필요' ? 'status-warning' : 'status-ok'}"><div class="value">${summary.오늘상태}</div><div class="label">상태</div></div>
  `;

  document.getElementById('resultBody').innerHTML = analyzed.map(i => `
    <tr>
      <td>${i.품목코드}</td>
      <td>${i.재료명}</td>
      <td>${i.현재재고}</td>
      <td>${i.안전재고}</td>
      <td>${i.부족수량}</td>
      <td>${i.발주권장수량}</td>
      <td><span class="badge ${i.상태 === '발주 필요' ? 'badge-danger' : 'badge-success'}">${i.상태}</span></td>
      <td>${i.거래처}</td>
    </tr>
  `).join('');

  document.getElementById('ordersSection').style.display = orders.length ? 'block' : 'none';
  document.getElementById('ordersList').innerHTML = orders.map((o, idx) => {
    window._orderData = window._orderData || {};
    window._orderData['ord' + idx] = { supplier: o.거래처 || '', email: o.거래처이메일 || '', items: o.품목목록 || [] };
    const status = orderSendStatus[o.거래처];
    const statusHtml = status ? `<span class="send-status ${status === 'success' ? 'send-success' : 'send-fail'}">${status === 'success' ? '발송성공' : '발송실패'}</span>` : '';
    return `
      <div class="order-card" data-supplier="${o.거래처}" data-order-id="ord${idx}">
        <div class="order-card-header">
          <h4>${o.거래처}</h4>
          ${statusHtml}
        </div>
        <div class="order-meta">품목 ${o.품목수}개 · 총 ${o.총발주수량}개</div>
        <ul class="order-items">${(o.품목목록 || []).map(i => `<li>${i.재료명} ${i.발주권장수량}${i.단위}</li>`).join('')}</ul>
        <button class="btn btn-primary btn-send-order">이메일 보내기</button>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.btn-send-order').forEach(btn => {
    btn.addEventListener('click', () => {
      const oid = btn.closest('.order-card').dataset.orderId;
      const data = (window._orderData || {})[oid];
      if (data) openEmailModal(data);
    });
  });
});

document.getElementById('btnCloseModal').addEventListener('click', () => {
  document.getElementById('emailModal').classList.remove('active');
});

document.getElementById('btnSendEmail').addEventListener('click', doSendEmail);
document.getElementById('storeName').addEventListener('input', updateEmailPreview);
document.getElementById('emailTo').addEventListener('input', updateEmailPreview);

document.getElementById('emailModal').addEventListener('click', (e) => {
  if (e.target.id === 'emailModal') {
    document.getElementById('emailModal').classList.remove('active');
  }
});

document.getElementById('emailModal').querySelector('.modal-content').addEventListener('click', e => e.stopPropagation());

renderInputTable();
