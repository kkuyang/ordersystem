// EmailJS 설정 (localStorage에 저장, UI에서 입력 가능)
let EMAILJS = JSON.parse(localStorage.getItem('domino_emailjs') || '{"publicKey":"","serviceId":"","templateId":""}');
function saveEmailJSConfig() {
  localStorage.setItem('domino_emailjs', JSON.stringify(EMAILJS));
}

// domino_inventory_training.xlsx 기준 데이터
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

const SUPPLIERS = [
  { 거래처명: "도미노푸드서플라이", 담당자: "박지훈", 이메일: "kutest6240@gmail.com", 품목군: "도우/소스/치즈" },
  { 거래처명: "프레시미트코리아", 담당자: "김현우", 이메일: "kutest6240@gmail.com", 품목군: "페퍼로니/베이컨" },
  { 거래처명: "그린베지유통", 담당자: "이수진", 이메일: "kutest6240@gmail.com", 품목군: "양파/피망/버섯" },
  { 거래처명: "토핑솔루션", 담당자: "정민아", 이메일: "kutest6240@gmail.com", 품목군: "올리브/콘" }
];

let inventoryData = JSON.parse(JSON.stringify(DEFAULT_INVENTORY));

function renderInputTable() {
  const tbody = document.getElementById('invBody');
  const esc = v => String(v ?? '').replace(/"/g, '&quot;');
  tbody.innerHTML = inventoryData.map((item, idx) => `
    <tr>
      <td><input type="text" data-idx="${idx}" data-field="품목코드" value="${esc(item.품목코드)}" placeholder="ING001"></td>
      <td><input type="text" data-idx="${idx}" data-field="재료명" value="${esc(item.재료명)}" placeholder="도우볼"></td>
      <td><input type="text" data-idx="${idx}" data-field="규격" value="${esc(item.규격)}" placeholder="220g"></td>
      <td><input type="text" data-idx="${idx}" data-field="단위" value="${esc(item.단위)}" placeholder="개"></td>
      <td class="col-num"><input type="number" min="0" data-idx="${idx}" data-field="현재재고" value="${item.현재재고}"></td>
      <td class="col-num"><input type="number" min="0" data-idx="${idx}" data-field="안전재고" value="${item.안전재고}"></td>
      <td class="col-num"><input type="number" min="0" data-idx="${idx}" data-field="MOQ" value="${item.MOQ}"></td>
      <td><input type="text" data-idx="${idx}" data-field="거래처" value="${esc(item.거래처)}" placeholder="도미노푸드서플라이"></td>
      <td><input type="text" data-idx="${idx}" data-field="거래처이메일" value="${esc(item.거래처이메일)}" placeholder="email@example.com"></td>
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
  document.getElementById('emailjsPublicKey').value = EMAILJS.publicKey || '';
  document.getElementById('emailjsServiceId').value = EMAILJS.serviceId || '';
  document.getElementById('emailjsTemplateId').value = EMAILJS.templateId || '';
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

async function doSendEmail() {
  const to = document.getElementById('emailTo').value.trim();
  const store = document.getElementById('storeName').value || '점포';
  const supplier = document.getElementById('emailModal').dataset.supplier || '';
  const items = JSON.parse(document.getElementById('emailModal').dataset.itemsJson || '[]');

  if (!to) {
    alert('수신 이메일을 입력해주세요.');
    return;
  }
  if (items.length === 0) {
    alert('발주 품목이 없습니다.');
    return;
  }

  const { subject, body } = getEmailContent(supplier, store, items);

  const btn = document.getElementById('btnSendEmail');
  btn.disabled = true;
  btn.textContent = '발송 중...';

  const apiUrl = '/api/send-email';

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_email: to, supplier_name: supplier, store_name: store, items })
    });
    const data = await res.json();

    if (res.ok) {
      alert(data.message || '이메일이 발송되었습니다.');
      document.getElementById('emailModal').classList.remove('active');
      btn.disabled = false;
      btn.textContent = '✉️ 이메일 보내기';
      return;
    }
    throw new Error(data.error || '발송 실패');
  } catch (err) {
    const pk = document.getElementById('emailjsPublicKey')?.value?.trim() || EMAILJS.publicKey;
    const sid = document.getElementById('emailjsServiceId')?.value?.trim() || EMAILJS.serviceId;
    const tid = document.getElementById('emailjsTemplateId')?.value?.trim() || EMAILJS.templateId;

    if (pk && sid && tid && typeof emailjs !== 'undefined') {
      try {
        emailjs.init(pk);
        await emailjs.send(sid, tid, { to_email: to, subject: subject, message: body });
        alert('이메일이 발송되었습니다.');
        document.getElementById('emailModal').classList.remove('active');
      } catch (e2) {
        alert('발송 실패: ' + (e2.text || e2.message || String(e2)) + '\n\nPython 서버: python app.py 실행 후 http://localhost:5000 접속\n또는 EmailJS 설정을 확인하세요.');
      }
    } else {
      alert('이메일 발송을 위해 다음 중 하나를 선택하세요:\n\n① Python: 터미널에서 python app.py 실행 후 http://localhost:5000 접속 (Gmail 앱 비밀번호 사용)\n② EmailJS: 아래 설정에서 Public Key, Service ID, Template ID 입력');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = '✉️ 이메일 보내기';
  }
}

document.getElementById('btnAnalyze').addEventListener('click', () => {
  syncFromInputs();
  const analyzed = analyzeInventory();
  const orders = getOrdersBySupplier(analyzed);
  const summary = {
    총품목수: analyzed.length,
    발주필요품목수: analyzed.filter(i => i.상태 === '발주 필요').length,
    전체권장발주수량: analyzed.reduce((s, i) => s + (i.발주권장수량 || 0), 0),
    오늘상태: analyzed.some(i => i.상태 === '발주 필요') ? '담당자 확인 필요' : '정상'
  };

  document.getElementById('summarySection').style.display = 'block';
  document.getElementById('summaryGrid').innerHTML = `
    <div class="summary-item"><div class="value">${summary.총품목수}</div><div class="label">총 품목 수</div></div>
    <div class="summary-item ${summary.발주필요품목수 > 0 ? 'status-warning' : 'status-ok'}"><div class="value">${summary.발주필요품목수}</div><div class="label">발주 필요 품목</div></div>
    <div class="summary-item"><div class="value">${summary.전체권장발주수량}</div><div class="label">전체 권장 발주 수량</div></div>
    <div class="summary-item ${summary.오늘상태 === '담당자 확인 필요' ? 'status-warning' : 'status-ok'}"><div class="value">${summary.오늘상태}</div><div class="label">오늘 상태</div></div>
  `;

  document.getElementById('resultSection').style.display = 'block';
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
    return `
      <div class="order-card" data-order-id="ord${idx}">
        <h4>${o.거래처}</h4>
        <div class="meta">품목 ${o.품목수}개, 총 발주 수량 ${o.총발주수량}</div>
        <ul class="items">${(o.품목목록 || []).map(i => `<li>${i.재료명}: ${i.발주권장수량}${i.단위}</li>`).join('')}</ul>
        <div class="actions">
          <button class="btn btn-primary btn-open-email">✉️ 이메일 보내기</button>
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.btn-open-email').forEach(btn => {
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

document.getElementById('btnSaveEmailJS').addEventListener('click', () => {
  EMAILJS = {
    publicKey: document.getElementById('emailjsPublicKey').value.trim(),
    serviceId: document.getElementById('emailjsServiceId').value.trim(),
    templateId: document.getElementById('emailjsTemplateId').value.trim()
  };
  saveEmailJSConfig();
  alert('EmailJS 설정이 저장되었습니다. 이제 HTML에서 바로 이메일을 보낼 수 있습니다.');
});

document.getElementById('emailModal').addEventListener('click', (e) => {
  if (e.target.id === 'emailModal' || e.target.classList.contains('modal')) {
    document.getElementById('emailModal').classList.remove('active');
  }
});

document.getElementById('emailModal').querySelector('.modal-content').addEventListener('click', e => e.stopPropagation());

renderInputTable();
