/* ============================================
   FireGuard Pro — Application Logic
   소방 점검 재고관리 SaaS
   ============================================ */

// ============ MOCK DATA ============
const MOCK_DATA = {
    companies: [
        { id: 'c1', name: '🔥 한빛소방안전', contact: '02-1234-5678' },
        { id: 'c2', name: '🔥 태양소방점검', contact: '031-9876-5432' },
    ],
    sites: [
        { id: 's1', companyId: 'c1', name: '강남 삼성타워', address: '서울시 강남구 테헤란로 123', managerName: '김대리', managerPhone: '010-1111-2222' },
        { id: 's2', companyId: 'c1', name: '판교 테크노밸리 A동', address: '경기도 성남시 분당구 판교로 256', managerName: '이과장', managerPhone: '010-3333-4444' },
        { id: 's3', companyId: 'c1', name: '잠실 롯데타워', address: '서울시 송파구 올림픽로 300', managerName: '박대리', managerPhone: '010-5555-6666' },
        { id: 's4', companyId: 'c2', name: '수원 삼성전자 공장', address: '경기도 수원시 영통구 삼성로 129', managerName: '최팀장', managerPhone: '010-7777-8888' },
        { id: 's5', companyId: 'c2', name: '화성 물류창고', address: '경기도 화성시 동탄면 산업로 88', managerName: '정주임', managerPhone: '010-9999-0000' },
    ],
    inventories: [
        { id: 'i1', companyId: 'c1', partName: '소화기 (ABC 3.3kg)', quantity: 45, minimumStock: 20 },
        { id: 'i2', companyId: 'c1', partName: '스프링클러 헤드', quantity: 12, minimumStock: 15 },
        { id: 'i3', companyId: 'c1', partName: '감지기 (연기형)', quantity: 30, minimumStock: 10 },
        { id: 'i4', companyId: 'c1', partName: '유도등 (피난)', quantity: 8, minimumStock: 10 },
        { id: 'i5', companyId: 'c1', partName: '소화전 호스 (15m)', quantity: 5, minimumStock: 8 },
        { id: 'i6', companyId: 'c1', partName: '방화문 도어클로저', quantity: 18, minimumStock: 5 },
        { id: 'i7', companyId: 'c1', partName: '비상조명등', quantity: 3, minimumStock: 6 },
        { id: 'i8', companyId: 'c1', partName: '가스누설 감지기', quantity: 22, minimumStock: 8 },
        { id: 'i9', companyId: 'c2', partName: '소화기 (ABC 3.3kg)', quantity: 60, minimumStock: 25 },
        { id: 'i10', companyId: 'c2', partName: '스프링클러 헤드', quantity: 40, minimumStock: 15 },
        { id: 'i11', companyId: 'c2', partName: '감지기 (열감지형)', quantity: 7, minimumStock: 12 },
        { id: 'i12', companyId: 'c2', partName: '소화전 호스 (15m)', quantity: 15, minimumStock: 10 },
    ],
    checkLogs: [
        {
            id: 'cl1', siteId: 's1', inspectorName: '김철수', checkDate: '2026-04-19',
            details: '1층~5층 소화기 전수 점검 완료. 3층 소화기 1대 교체함.',
            usedParts: [{ inventoryId: 'i1', partName: '소화기 (ABC 3.3kg)', amount: 1 }]
        },
        {
            id: 'cl2', siteId: 's2', inspectorName: '박영희', checkDate: '2026-04-18',
            details: '스프링클러 동파 점검. B구역 헤드 3개 교체.',
            usedParts: [
                { inventoryId: 'i2', partName: '스프링클러 헤드', amount: 3 },
                { inventoryId: 'i3', partName: '감지기 (연기형)', amount: 1 }
            ]
        },
        {
            id: 'cl3', siteId: 's4', inspectorName: '이준호', checkDate: '2026-04-18',
            details: '공장 전체 소방 설비 정기 점검. 이상 없음.',
            usedParts: []
        },
        {
            id: 'cl4', siteId: 's3', inspectorName: '최민지', checkDate: '2026-04-17',
            details: '지하 주차장 비상조명등 및 유도등 점검. 유도등 2개 교체.',
            usedParts: [
                { inventoryId: 'i4', partName: '유도등 (피난)', amount: 2 },
                { inventoryId: 'i7', partName: '비상조명등', amount: 1 }
            ]
        },
    ],
};

// ============ NOTIFICATION LOGS ============
const notificationLogs = [];

// ============ INVENTORY HISTORY ============
const inventoryHistory = [];

// ============ STATE ============
let state = {
    currentView: 'inspection',
    selectedCompanyId: null,
    selectedSiteId: null,
    uploadedPhotos: [],
    partRows: [],
    charts: {},
};

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initInspectionView();
    initDashboard();
    setHeaderDate();
});

// ============ NAVIGATION ============
function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
        });
    });
}

function switchView(viewName) {
    state.currentView = viewName;

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

    if (viewName === 'dashboard') {
        renderDashboard();
    } else if (viewName === 'notifications') {
        renderNotificationView();
    } else if (viewName === 'history') {
        renderHistoryView();
    }
}

// ============ HEADER DATE ============
function setHeaderDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
    document.getElementById('header-date').textContent = now.toLocaleDateString('ko-KR', options);
}

// ============ INSPECTION VIEW ============
function initInspectionView() {
    populateCompanies();
    addPartRow();  // 기본 1개 행

    document.getElementById('select-company').addEventListener('change', onCompanyChange);
    document.getElementById('select-site').addEventListener('change', onSiteChange);
    document.getElementById('btn-add-part').addEventListener('click', addPartRow);
    document.getElementById('btn-submit').addEventListener('click', submitCheckLog);
    document.getElementById('btn-close-modal').addEventListener('click', closeSuccessModal);

    // Photo upload
    const uploadArea = document.getElementById('photo-upload-area');
    const photoInput = document.getElementById('photo-input');

    uploadArea.addEventListener('click', (e) => {
        if (e.target.closest('.remove-photo')) return;
        photoInput.click();
    });

    photoInput.addEventListener('change', handlePhotoUpload);
}

function populateCompanies() {
    const sel = document.getElementById('select-company');
    MOCK_DATA.companies.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        sel.appendChild(opt);
    });
}

function onCompanyChange(e) {
    const companyId = e.target.value;
    state.selectedCompanyId = companyId;
    state.selectedSiteId = null;

    const siteSel = document.getElementById('select-site');
    siteSel.innerHTML = '<option value="">현장을 선택하세요</option>';

    if (!companyId) {
        siteSel.disabled = true;
        hideSiteInfo();
        clearPartOptions();
        return;
    }

    siteSel.disabled = false;
    const sites = MOCK_DATA.sites.filter(s => s.companyId === companyId);
    sites.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        siteSel.appendChild(opt);
    });

    hideSiteInfo();
    refreshPartOptions();
}

function onSiteChange(e) {
    const siteId = e.target.value;
    state.selectedSiteId = siteId;

    if (!siteId) {
        hideSiteInfo();
        return;
    }

    const site = MOCK_DATA.sites.find(s => s.id === siteId);
    document.getElementById('selected-site-name').textContent = site.name;
    document.getElementById('selected-site-address').textContent = `${site.address} · 담당: ${site.managerName} (${site.managerPhone})`;
    document.getElementById('site-info-banner').classList.remove('hidden');
}

function hideSiteInfo() {
    document.getElementById('site-info-banner').classList.add('hidden');
}

// --- Part Rows ---
function addPartRow() {
    const list = document.getElementById('parts-list');
    const rowId = `part-${Date.now()}`;

    const row = document.createElement('div');
    row.className = 'part-row';
    row.id = rowId;

    const sel = document.createElement('select');
    sel.innerHTML = '<option value="">부품 선택</option>';
    populatePartSelect(sel);

    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.className = 'qty-input';
    qtyInput.placeholder = '수량';
    qtyInput.min = '1';
    qtyInput.value = '1';

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove';
    removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    removeBtn.addEventListener('click', () => {
        row.remove();
        state.partRows = state.partRows.filter(r => r.id !== rowId);
    });

    row.appendChild(sel);
    row.appendChild(qtyInput);
    row.appendChild(removeBtn);
    list.appendChild(row);

    state.partRows.push({ id: rowId, selectEl: sel, qtyEl: qtyInput });
}

function populatePartSelect(sel) {
    if (!state.selectedCompanyId) return;
    const parts = MOCK_DATA.inventories.filter(inv => inv.companyId === state.selectedCompanyId);
    parts.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.partName} (재고: ${p.quantity})`;
        sel.appendChild(opt);
    });
}

function refreshPartOptions() {
    state.partRows.forEach(pr => {
        const sel = pr.selectEl;
        const curVal = sel.value;
        sel.innerHTML = '<option value="">부품 선택</option>';
        populatePartSelect(sel);
        if (curVal) sel.value = curVal;
    });
}

function clearPartOptions() {
    state.partRows.forEach(pr => {
        pr.selectEl.innerHTML = '<option value="">부품 선택</option>';
    });
}

// --- Photo Upload ---
function handlePhotoUpload(e) {
    const files = Array.from(e.target.files);
    const maxPhotos = 5;

    files.forEach(file => {
        if (state.uploadedPhotos.length >= maxPhotos) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            state.uploadedPhotos.push({ name: file.name, data: ev.target.result });
            renderPhotoPreview();
        };
        reader.readAsDataURL(file);
    });

    // hide placeholder if photos exist
    const placeholder = document.getElementById('upload-placeholder');
    if (files.length > 0) placeholder.style.display = 'none';
}

function renderPhotoPreview() {
    const grid = document.getElementById('photo-preview-grid');
    grid.innerHTML = '';

    state.uploadedPhotos.forEach((photo, idx) => {
        const thumb = document.createElement('div');
        thumb.className = 'preview-thumb';
        thumb.innerHTML = `
            <img src="${photo.data}" alt="${photo.name}">
            <button class="remove-photo" data-idx="${idx}"><i class="fa-solid fa-xmark"></i></button>
        `;
        thumb.querySelector('.remove-photo').addEventListener('click', (e) => {
            e.stopPropagation();
            state.uploadedPhotos.splice(idx, 1);
            renderPhotoPreview();
            if (state.uploadedPhotos.length === 0) {
                document.getElementById('upload-placeholder').style.display = 'flex';
            }
        });
        grid.appendChild(thumb);
    });
}

// ============ TOAST SYSTEM ============
function showToast(message, type = 'error', duration = 4000) {
    const container = document.getElementById('toast-container');
    const icons = {
        error: 'fa-circle-xmark',
        warning: 'fa-triangle-exclamation',
        success: 'fa-circle-check',
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fa-solid ${icons[type] || icons.error}"></i>
        <span class="toast-msg">${message}</span>
        <button class="toast-close" onclick="this.parentElement.classList.add('leaving'); setTimeout(() => this.parentElement.remove(), 300);"><i class="fa-solid fa-xmark"></i></button>
    `;
    container.appendChild(toast);

    // Auto-remove
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('leaving');
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

// --- Submit ---
function submitCheckLog() {
    // Clear previous error highlights
    document.querySelectorAll('.part-row.stock-error').forEach(el => {
        el.classList.remove('stock-error');
        el.querySelectorAll('.stock-error-label').forEach(l => l.remove());
    });

    // Validation: 현장 선택
    if (!state.selectedSiteId) {
        shakeElement(document.getElementById('step-site'));
        showToast('현장을 선택해주세요.', 'warning');
        return;
    }

    // Validation: 점검자 이름
    const inspectorName = document.getElementById('inspector-name').value.trim();
    if (!inspectorName) {
        shakeElement(document.getElementById('step-photo'));
        showToast('점검자 이름을 입력해주세요.', 'warning');
        return;
    }

    // Collect used parts with STRICT validation
    const usedParts = [];
    let hasError = false;

    for (const pr of state.partRows) {
        const invId = pr.selectEl.value;
        const qty = parseInt(pr.qtyEl.value, 10);
        if (!invId) continue;

        // Validation: 수량 최소값
        if (!qty || qty < 1) {
            showToast('사용 수량은 1개 이상이어야 합니다.', 'error');
            const row = document.getElementById(pr.id);
            row.classList.add('stock-error');
            hasError = true;
            continue;
        }

        // ★ 안전장치: 재고 부족 검증 ★
        const inv = MOCK_DATA.inventories.find(i => i.id === invId);
        if (qty > inv.quantity) {
            showToast(
                `🚨 재고가 부족합니다! "${inv.partName}" 현재고: ${inv.quantity}개, 입력량: ${qty}개`,
                'error',
                6000
            );
            // 해당 행 빨간 하이라이트
            const row = document.getElementById(pr.id);
            row.classList.add('stock-error');
            const errLabel = document.createElement('span');
            errLabel.className = 'stock-error-label';
            errLabel.textContent = `⚠️ 재고 부족: 현재 ${inv.quantity}개 남음`;
            row.appendChild(errLabel);
            hasError = true;
            continue;
        }

        usedParts.push({
            inventoryId: invId,
            partName: inv.partName,
            amount: qty,
        });
    }

    // ★ 에러가 하나라도 있으면 저장 완전 차단 ★
    if (hasError) {
        shakeElement(document.getElementById('step-parts'));
        return;
    }

    // 안전하게 통과된 경우만 실제 차감 실행
    const site = MOCK_DATA.sites.find(s => s.id === state.selectedSiteId);

    // Deduct inventory + 이력 기록
    usedParts.forEach(up => {
        const inv = MOCK_DATA.inventories.find(i => i.id === up.inventoryId);
        const prevQty = inv.quantity;
        inv.quantity -= up.amount;

        // ★ 재고 이력 자동 기록 ★
        inventoryHistory.unshift({
            id: `h-${Date.now()}-${inv.id}`,
            timestamp: new Date().toISOString(),
            type: 'deduct',
            inventoryId: inv.id,
            partName: inv.partName,
            prevQuantity: prevQty,
            newQuantity: inv.quantity,
            changeAmount: -up.amount,
            changedBy: inspectorName,
            siteName: site.name,
            reason: `점검 시 사용 (현장: ${site.name})`,
        });
    });

    // Find low-stock items after deduction
    const lowStockParts = usedParts
        .map(up => MOCK_DATA.inventories.find(i => i.id === up.inventoryId))
        .filter(inv => inv.quantity <= inv.minimumStock);

    // Save check log
    const newLog = {
        id: `cl-${Date.now()}`,
        siteId: state.selectedSiteId,
        inspectorName,
        checkDate: new Date().toISOString().slice(0, 10),
        details: document.getElementById('check-details').value.trim(),
        usedParts,
    };
    MOCK_DATA.checkLogs.unshift(newLog);

    // Show success modal + toast
    showSuccessModal(usedParts);
    showToast(`✅ 점검 일지 제출 완료! 재고 ${usedParts.length}건 차감됨`, 'success');

    // Simulate AlimTalk notification
    simulateAlimTalk(site, inspectorName, usedParts, lowStockParts, newLog);

    // Reset form
    resetForm();
}

function showSuccessModal(usedParts) {
    const modal = document.getElementById('success-modal');
    const summary = document.getElementById('deduction-summary');

    summary.innerHTML = '';
    usedParts.forEach(up => {
        const inv = MOCK_DATA.inventories.find(i => i.id === up.inventoryId);
        const div = document.createElement('div');
        div.className = 'deduction-item';
        div.innerHTML = `
            <span class="part-label">${up.partName}</span>
            <span class="deduction-qty">-${up.amount}개 → 남은 재고: ${inv.quantity}개</span>
        `;
        summary.appendChild(div);
    });

    modal.classList.remove('hidden');
}

function closeSuccessModal() {
    document.getElementById('success-modal').classList.add('hidden');
}

// ============ ALIMTALK SIMULATION ============
function simulateAlimTalk(site, inspectorName, usedParts, lowStockParts, log) {
    const statusBody = document.getElementById('notif-status-body');
    // Show sending state
    statusBody.innerHTML = `
        <div class="notif-sending">
            <div class="spinner"></div>
            <span>${site.managerName} (${site.managerPhone})에게 발송 중...</span>
        </div>
    `;

    // Build message content
    const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    const partsText = usedParts.map(up => `  • ${up.partName}: ${up.amount}개 교체`).join('\n');

    // Simulate API delay (1.5s)
    setTimeout(() => {
        // Message 1: 점검 완료 요약본
        const summaryMsg = `[FireGuard Pro] 점검 완료 안내\n\n안녕하세요 ${site.managerName}님,\n${site.name}의 소방 점검이 완료되었습니다.\n\n📋 점검 요약\n• 점검일: ${today}\n• 점검자: ${inspectorName}\n• 점검 내용: ${log.details || '정기 점검'}\n\n🔧 교체 부품\n${partsText || '  (교체 부품 없음)'}\n\n감사합니다.`;

        let resultHtml = `
            <div class="notif-result-item success">
                <i class="fa-solid fa-circle-check"></i>
                <div class="notif-detail">
                    <strong>✅ 점검 완료 요약본 발송됨</strong>
                    <span>${site.managerName} · ${maskPhone(site.managerPhone)}</span>
                </div>
            </div>
        `;

        // Build notification log entry
        const logEntry = {
            id: `n-${Date.now()}`,
            timestamp: new Date().toISOString(),
            siteName: site.name,
            managerName: site.managerName,
            managerPhone: site.managerPhone,
            inspectorName,
            types: ['summary'],
            summaryMessage: summaryMsg,
            replaceMessage: null,
        };

        // Message 2: 부품 교체 필요 안내 (재고 부족 시)
        if (lowStockParts.length > 0) {
            const replaceText = lowStockParts.map(p =>
                `  ⚠️ ${p.partName}: 잔여 ${p.quantity}개 (기준 ${p.minimumStock}개)`
            ).join('\n');

            const replaceMsg = `[FireGuard Pro] 부품 교체 필요 안내\n\n${site.managerName}님,\n아래 부품의 재고가 부족합니다.\n빠른 발주를 부탁드립니다.\n\n🚨 부족 품목\n${replaceText}\n\n담당 업체에 자동 발주 요청을 원하시면 아래 버튼을 눌러주세요.\n\n감사합니다.`;

            resultHtml += `
                <div class="notif-result-item info">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <div class="notif-detail">
                        <strong>🚨 부품 교체 필요 안내 발송됨</strong>
                        <span>부족 ${lowStockParts.length}건 · ${site.managerName}</span>
                    </div>
                </div>
            `;

            logEntry.types.push('replace');
            logEntry.replaceMessage = replaceMsg;
        }

        // Show kakao-style preview
        const previewLines = usedParts.map(up => `• ${up.partName}: ${up.amount}개 교체`).join('<br>');
        resultHtml += `
            <div class="kakao-preview">
                <strong>🔥 [FireGuard Pro] 점검 완료 안내</strong>
                ${site.name}의 소방 점검이 완료되었습니다.
                <hr class="kakao-divider">
                📋 점검자: ${inspectorName}<br>
                🔧 교체 부품:<br>
                ${previewLines || '(교체 부품 없음)'}
                ${lowStockParts.length > 0 ? '<hr class="kakao-divider">🚨 <b>재고 부족 품목 발생!</b><br>관리자 확인이 필요합니다.' : ''}
                <div class="kakao-footer">FireGuard Pro · ${today}</div>
            </div>
        `;

        statusBody.innerHTML = resultHtml;

        // Save to notification logs
        notificationLogs.unshift(logEntry);
        updateNotifBadge();
    }, 1500);
}

function maskPhone(phone) {
    return phone.replace(/(\d{3}-\d{2})\d{2}(-\d{4})/, '$1**$2');
}

function updateNotifBadge() {
    const badge = document.getElementById('nav-notif-badge');
    if (notificationLogs.length > 0) {
        badge.textContent = notificationLogs.length;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// ============ NOTIFICATION VIEW ============
function renderNotificationView() {
    const list = document.getElementById('notif-log-list');

    if (notificationLogs.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-inbox"></i>
                <p>아직 발송된 알림이 없습니다.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = '';
    notificationLogs.forEach(entry => {
        const time = new Date(entry.timestamp);
        const timeStr = time.toLocaleString('ko-KR', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const typeBadges = entry.types.map(t => {
            if (t === 'summary') return '<span class="notif-type-badge summary">📋 점검 요약</span>';
            if (t === 'replace') return '<span class="notif-type-badge replace">🚨 교체 필요</span>';
            return '';
        }).join('');

        const el = document.createElement('div');
        el.className = 'notif-log-entry';
        el.innerHTML = `
            <div class="notif-log-header">
                <div class="notif-log-title">
                    <i class="fa-solid fa-comment-dots"></i>
                    <span>${entry.siteName}</span>
                </div>
                <span class="notif-log-time">${timeStr}</span>
            </div>
            <div class="notif-log-meta">
                <span class="notif-meta-tag site"><i class="fa-solid fa-user"></i> ${entry.managerName}</span>
                <span class="notif-meta-tag phone"><i class="fa-solid fa-phone"></i> ${maskPhone(entry.managerPhone)}</span>
                <span class="notif-meta-tag status-sent"><i class="fa-solid fa-check"></i> 발송완료</span>
            </div>
            <div class="notif-log-types">${typeBadges}</div>
            <div class="kakao-preview">
                <strong>🔥 [FireGuard Pro] 알림톡</strong>
                점검자: ${entry.inspectorName}<br>
                현장: ${entry.siteName}<br>
                ${entry.types.includes('replace') ? '<hr class="kakao-divider">🚨 재고 부족 품목이 있습니다.' : '정상 점검 완료'}
                <div class="kakao-footer">KakaoTalk 알림톡 · 자동 발송</div>
            </div>
        `;
        list.appendChild(el);
    });
}

function resetForm() {
    document.getElementById('select-company').value = '';
    document.getElementById('select-site').innerHTML = '<option value="">현장을 선택하세요</option>';
    document.getElementById('select-site').disabled = true;
    hideSiteInfo();
    document.getElementById('inspector-name').value = '';
    document.getElementById('check-details').value = '';
    state.selectedCompanyId = null;
    state.selectedSiteId = null;
    state.uploadedPhotos = [];
    document.getElementById('photo-preview-grid').innerHTML = '';
    document.getElementById('upload-placeholder').style.display = 'flex';

    // Reset part rows
    document.getElementById('parts-list').innerHTML = '';
    state.partRows = [];
    addPartRow();
}

function shakeElement(el) {
    el.style.animation = 'none';
    el.offsetHeight;  // reflow
    el.style.animation = 'shake 0.5s ease';
    setTimeout(() => el.style.animation = '', 500);
}

// ============ INVENTORY HISTORY VIEW ============
function renderHistoryView(filterType = 'all') {
    const timeline = document.getElementById('history-timeline');
    const countEl = document.getElementById('history-total-count');
    const filterEl = document.getElementById('history-filter-type');

    // Bind filter change
    filterEl.onchange = () => renderHistoryView(filterEl.value);

    // Filter entries
    let entries = inventoryHistory;
    if (filterType !== 'all') {
        entries = entries.filter(e => e.type === filterType);
    }

    countEl.textContent = `${entries.length}건`;

    if (entries.length === 0) {
        timeline.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-inbox"></i>
                <p>아직 재고 변동 이력이 없습니다.</p>
            </div>
        `;
        return;
    }

    timeline.innerHTML = '';
    entries.forEach(entry => {
        const time = new Date(entry.timestamp);
        const timeStr = time.toLocaleString('ko-KR', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        const isDeduct = entry.type === 'deduct';
        const icon = isDeduct ? 'fa-arrow-down' : 'fa-arrow-up';
        const changeLabel = isDeduct
            ? `${entry.changeAmount}개`
            : `+${entry.changeAmount}개`;
        const arrow = `${entry.prevQuantity} → ${entry.newQuantity}`;

        const el = document.createElement('div');
        el.className = 'history-entry';
        el.innerHTML = `
            <div class="history-dot ${entry.type}">
                <i class="fa-solid ${icon}"></i>
            </div>
            <div class="history-body">
                <div class="history-title">
                    ${entry.partName}
                </div>
                <div class="history-subtitle">
                    ${entry.reason} · ${arrow}
                </div>
                <div class="history-meta-row">
                    <span class="history-meta-tag who"><i class="fa-solid fa-user"></i> ${entry.changedBy}</span>
                    <span class="history-meta-tag where"><i class="fa-solid fa-location-dot"></i> ${entry.siteName}</span>
                    <span class="history-meta-tag when"><i class="fa-solid fa-clock"></i> ${timeStr}</span>
                    <span class="history-meta-tag qty-change ${entry.type}">${changeLabel}</span>
                </div>
            </div>
        `;
        timeline.appendChild(el);
    });
}

// ============ DASHBOARD ============
function initDashboard() {
    // Will render on view switch
}

function renderDashboard() {
    renderKPI();
    renderAlerts();
    renderCharts();
    renderInventoryTable();
    renderRecentLogs();
}

function renderKPI() {
    const allInventories = MOCK_DATA.inventories;
    const lowStock = allInventories.filter(i => i.quantity <= i.minimumStock);
    const allSites = MOCK_DATA.sites;
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayLogs = MOCK_DATA.checkLogs.filter(l => l.checkDate === todayStr);

    animateCounter('kpi-total-items', allInventories.length);
    animateCounter('kpi-low-stock', lowStock.length);
    animateCounter('kpi-today-checks', todayLogs.length);
    animateCounter('kpi-total-sites', allSites.length);
}

function animateCounter(elementId, target) {
    const el = document.getElementById(elementId);
    const duration = 600;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);  // easeOutCubic
        el.textContent = Math.round(start + (target - start) * eased);

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function renderAlerts() {
    const lowStock = MOCK_DATA.inventories.filter(i => i.quantity <= i.minimumStock);
    const section = document.getElementById('alert-section');
    const list = document.getElementById('alert-list');
    const count = document.getElementById('alert-count');

    if (lowStock.length === 0) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    count.textContent = lowStock.length;
    list.innerHTML = '';

    lowStock.forEach(inv => {
        const company = MOCK_DATA.companies.find(c => c.id === inv.companyId);
        const ratio = inv.quantity / inv.minimumStock;
        const urgency = ratio <= 0.5 ? '긴급' : '주의';

        const item = document.createElement('div');
        item.className = 'alert-item';
        item.innerHTML = `
            <div class="alert-item-info">
                <i class="fa-solid fa-circle-exclamation"></i>
                <div>
                    <div class="alert-part-name">${inv.partName}</div>
                    <div class="alert-part-detail">${company.name} · 현재 ${inv.quantity}개 / 적정 ${inv.minimumStock}개</div>
                </div>
            </div>
            <span class="stock-badge">${urgency} · ${inv.quantity}개</span>
        `;
        list.appendChild(item);
    });
}

function renderCharts() {
    renderStockChart();
    renderStatusChart();
}

function renderStockChart() {
    const ctx = document.getElementById('chart-stock').getContext('2d');
    const inventories = MOCK_DATA.inventories;
    const labels = inventories.map(i => i.partName.length > 12 ? i.partName.slice(0, 12) + '…' : i.partName);
    const currentData = inventories.map(i => i.quantity);
    const minData = inventories.map(i => i.minimumStock);

    if (state.charts.stock) state.charts.stock.destroy();

    state.charts.stock = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: '현재고',
                    data: currentData,
                    backgroundColor: currentData.map((v, idx) =>
                        v <= minData[idx] ? 'rgba(239, 68, 68, 0.7)' : 'rgba(59, 130, 246, 0.7)'
                    ),
                    borderColor: currentData.map((v, idx) =>
                        v <= minData[idx] ? '#ef4444' : '#3b82f6'
                    ),
                    borderWidth: 1.5,
                    borderRadius: 6,
                    barPercentage: 0.6,
                },
                {
                    label: '적정재고',
                    data: minData,
                    backgroundColor: 'rgba(234, 179, 8, 0.15)',
                    borderColor: '#eab308',
                    borderWidth: 1.5,
                    borderDash: [4, 4],
                    borderRadius: 6,
                    barPercentage: 0.6,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#94a3b8',
                        font: { family: 'Inter, Noto Sans KR', size: 11, weight: '600' },
                        padding: 16,
                        usePointStyle: true,
                        pointStyleWidth: 8,
                    }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    cornerRadius: 10,
                    padding: 12,
                    titleFont: { family: 'Inter, Noto Sans KR', weight: '700' },
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#64748b',
                        font: { size: 10, family: 'Inter, Noto Sans KR' },
                        maxRotation: 45,
                        minRotation: 30,
                    },
                    grid: { display: false },
                    border: { color: 'rgba(255,255,255,0.06)' }
                },
                y: {
                    ticks: {
                        color: '#64748b',
                        font: { size: 11, family: 'Inter, Noto Sans KR' },
                    },
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    border: { display: false },
                    beginAtZero: true,
                }
            }
        }
    });
}

function renderStatusChart() {
    const ctx = document.getElementById('chart-status').getContext('2d');
    const inventories = MOCK_DATA.inventories;

    const ok = inventories.filter(i => i.quantity > i.minimumStock * 1.2).length;
    const warn = inventories.filter(i => i.quantity > i.minimumStock && i.quantity <= i.minimumStock * 1.2).length;
    const danger = inventories.filter(i => i.quantity <= i.minimumStock).length;

    if (state.charts.status) state.charts.status.destroy();

    state.charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['충분', '주의', '부족'],
            datasets: [{
                data: [ok, warn, danger],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(234, 179, 8, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                ],
                borderColor: '#111827',
                borderWidth: 3,
                hoverOffset: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        font: { family: 'Inter, Noto Sans KR', size: 12, weight: '600' },
                        padding: 20,
                        usePointStyle: true,
                        pointStyleWidth: 10,
                    }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    cornerRadius: 10,
                    padding: 12,
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.parsed}개 품목`
                    }
                }
            }
        }
    });
}

function renderInventoryTable() {
    const tbody = document.getElementById('inventory-tbody');
    tbody.innerHTML = '';

    const sorted = [...MOCK_DATA.inventories].sort((a, b) => {
        const ratioA = a.quantity / a.minimumStock;
        const ratioB = b.quantity / b.minimumStock;
        return ratioA - ratioB;
    });

    sorted.forEach(inv => {
        const ratio = inv.quantity / inv.minimumStock;
        let statusClass, statusText, statusIcon;

        if (ratio <= 1) {
            statusClass = 'danger';
            statusText = '부족';
            statusIcon = 'fa-circle-exclamation';
        } else if (ratio <= 1.2) {
            statusClass = 'warning';
            statusText = '주의';
            statusIcon = 'fa-triangle-exclamation';
        } else {
            statusClass = 'ok';
            statusText = '충분';
            statusIcon = 'fa-circle-check';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${inv.partName}</td>
            <td style="font-weight:700; ${ratio <= 1 ? 'color: var(--red);' : ''}">${inv.quantity}</td>
            <td style="color: var(--text-muted);">${inv.minimumStock}</td>
            <td><span class="status-badge ${statusClass}"><i class="fa-solid ${statusIcon}"></i> ${statusText}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderRecentLogs() {
    const container = document.getElementById('recent-logs');
    container.innerHTML = '';

    const logs = MOCK_DATA.checkLogs.slice(0, 6);

    logs.forEach(log => {
        const site = MOCK_DATA.sites.find(s => s.id === log.siteId);
        const company = site ? MOCK_DATA.companies.find(c => c.id === site.companyId) : null;
        const initials = log.inspectorName.slice(0, 1);

        const item = document.createElement('div');
        item.className = 'log-item';

        let partsHtml = '';
        if (log.usedParts && log.usedParts.length > 0) {
            partsHtml = '<div class="log-parts">' +
                log.usedParts.map(up => `<span class="log-part-tag">${up.partName} ×${up.amount}</span>`).join('') +
                '</div>';
        }

        item.innerHTML = `
            <div class="log-avatar">${initials}</div>
            <div class="log-body">
                <div class="log-title">${site ? site.name : '알 수 없음'} · ${log.inspectorName}</div>
                <div class="log-meta">${company ? company.name : ''} · ${log.checkDate}</div>
                ${partsHtml}
            </div>
        `;
        container.appendChild(item);
    });
}
