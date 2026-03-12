const EMPTY_ROW = () => ({ 품목코드: "", 재료명: "", 규격: "", 단위: "", 현재재고: 0, 안전재고: 0, MOQ: 0, 거래처: "", 거래처이메일: "" });

let inventoryData = [];
let orderSendStatus = {};

const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:'))
  ? 'https://ordersystem-orcin.vercel.app'
  : '';

function addRow(atIndex) {
  inventoryData.splice(atIndex + 1, 0, EMPTY_ROW());
  renderInputTable();
}

function removeRow(atIndex) {
  inventoryData.splice(atIndex, 1);
  renderInputTable();
}

function renderInputTable() {
  const tbody = document.getElementById('invBody');
  const esc = v => String(v ?? '').replace(/"/g, '&quot;');
  const rowsHtml = inventoryData.map((item, idx) => `
    <tr data-idx="${idx}">
      <td class="col-actions">
        <button type="button" class="btn-row btn-remove" title="행 삭제">−</button>
        <button type="button" class="btn-row btn-add" title="행 추가">+</button>
      </td>
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
  const addRowHtml = inventoryData.length === 0 ? `
    <tr class="add-row-tr">
      <td colspan="10" class="add-row-cell">
        <button type="button" class="btn-add-first" title="행 추가">+ 행 추가</button>
      </td>
    </tr>
  ` : '';
  tbody.innerHTML = rowsHtml + addRowHtml;

  tbody.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      const field = e.target.dataset.field;
      const numFields = ['현재재고', '안전재고', 'MOQ'];
      const val = numFields.includes(field) ? (parseInt(e.target.value) || 0) : (e.target.value || '').trim();
      if (inventoryData[idx]) inventoryData[idx][field] = val;
    });
  });

  tbody.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.closest('tr').dataset.idx);
      removeRow(idx);
    });
  });
  tbody.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.closest('tr').dataset.idx);
      addRow(idx);
    });
  });
  tbody.querySelector('.btn-add-first')?.addEventListener('click', () => {
    inventoryData.push(EMPTY_ROW());
    renderInputTable();
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
  if (inventoryData.length === 0) {
    alert('재고 데이터를 입력하거나 엑셀 파일을 불러오세요.');
    return;
  }
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

document.getElementById('excelInput').addEventListener('change', function(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const wb = XLSX.read(ev.target.result, { type: 'binary' });
      const sheetName = wb.SheetNames.includes('Inventory') ? 'Inventory' : wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
      if (rows.length < 2) {
        alert('엑셀에 데이터가 없거나 헤더만 있습니다.');
        return;
      }
      const headerRow = rows[0].map(h => String(h || '').trim());
      const colMap = {};
      const keys = ['품목코드', '재료명', '규격', '단위', '현재재고', '안전재고', 'MOQ', '거래처', '거래처이메일', '이메일'];
      keys.forEach(k => {
        const idx = headerRow.findIndex(h => h === k || h.replace(/\s/g, '') === k);
        if (idx >= 0) colMap[k] = idx;
      });
      if (colMap['품목코드'] == null && colMap['재료명'] == null) {
        colMap['품목코드'] = 0;
        colMap['재료명'] = 1;
        colMap['규격'] = 2;
        colMap['단위'] = 3;
        colMap['현재재고'] = 4;
        colMap['안전재고'] = 5;
        colMap['MOQ'] = 6;
        colMap['거래처'] = 7;
        colMap['거래처이메일'] = 9;
      }
      const emailCol = colMap['거래처이메일'] ?? colMap['이메일'];
      const getVal = (row, key) => {
        const i = colMap[key];
        if (i == null) return '';
        const v = row[i];
        if (v == null || v === '') return '';
        if (typeof v === 'object' && v.w) return String(v.w);
        return String(v);
      };
      const getNum = (row, key) => {
        const v = getVal(row, key);
        const n = parseInt(v, 10);
        return isNaN(n) ? 0 : n;
      };
      inventoryData = rows.slice(1).filter(r => r && Array.isArray(r) && r.some(c => c !== '' && c != null)).map(row => ({
        품목코드: getVal(row, '품목코드').trim(),
        재료명: getVal(row, '재료명').trim(),
        규격: getVal(row, '규격').trim(),
        단위: getVal(row, '단위').trim(),
        현재재고: getNum(row, '현재재고'),
        안전재고: getNum(row, '안전재고'),
        MOQ: getNum(row, 'MOQ'),
        거래처: getVal(row, '거래처').trim(),
        거래처이메일: getVal(row, '거래처이메일').trim() || getVal(row, '이메일').trim()
      })).filter(item => item.품목코드 || item.재료명);
      if (inventoryData.length === 0) {
        alert('읽을 수 있는 재고 데이터가 없습니다. Inventory 시트에 품목코드, 재료명 등이 있는지 확인하세요.');
        return;
      }
      renderInputTable();
    } catch (err) {
      alert('엑셀 파싱 오류: ' + err.message);
    }
    e.target.value = '';
  };
  reader.readAsBinaryString(file);
});

renderInputTable();
