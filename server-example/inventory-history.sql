-- =========================================================
-- FireGuard Pro — 재고 이력(Audit Log) 테이블
-- 재고가 변동될 때마다 자동 기록됩니다.
-- =========================================================

-- 1. 재고 이력 테이블 생성
CREATE TABLE inventory_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
    
    -- 변동 타입: 'deduct'(차감), 'add'(입고), 'adjust'(수동 조정)
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('deduct', 'add', 'adjust')),
    
    -- 수량 변동 정보
    prev_quantity INTEGER NOT NULL,      -- 변경 전 수량
    new_quantity INTEGER NOT NULL,        -- 변경 후 수량
    change_amount INTEGER NOT NULL,      -- 변동량 (음수 = 차감, 양수 = 입고)
    
    -- 누가 변경했는가
    changed_by VARCHAR(255) NOT NULL,    -- 점검자 이름 또는 관리자 이름
    
    -- 어디서 변경되었는가
    site_id UUID REFERENCES sites(id),   -- 현장 ID (점검 시 사용)
    site_name VARCHAR(255),              -- 현장명 (빠른 조회용)
    
    -- 변경 사유
    reason TEXT,                          -- "점검 시 사용", "재입고", "수동 조정" 등
    check_log_id UUID REFERENCES check_logs(id), -- 관련 점검일지 (있을 경우)
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 조회 성능을 위한 인덱스
CREATE INDEX idx_history_inventory ON inventory_history(inventory_id);
CREATE INDEX idx_history_type ON inventory_history(change_type);
CREATE INDEX idx_history_date ON inventory_history(created_at DESC);
CREATE INDEX idx_history_site ON inventory_history(site_id);

-- 3. 재고 차감 시 자동 이력 기록 트리거 (기존 deduct 트리거 확장)
CREATE OR REPLACE FUNCTION log_inventory_change()
RETURNS TRIGGER AS $$
BEGIN
    -- used_parts INSERT 시 → 자동으로 이력 생성
    INSERT INTO inventory_history (
        inventory_id, change_type,
        prev_quantity, new_quantity, change_amount,
        changed_by, site_id, site_name,
        reason, check_log_id
    )
    SELECT
        NEW.inventory_id,
        'deduct',
        i.quantity + NEW.used_amount,    -- 차감 전 수량 (이미 차감된 상태이므로 역산)
        i.quantity,                       -- 차감 후 수량
        -NEW.used_amount,
        cl.inspector_name,
        s.id,
        s.name,
        '점검 시 사용 (자동 차감)',
        NEW.check_log_id
    FROM inventories i
    JOIN check_logs cl ON cl.id = NEW.check_log_id
    JOIN sites s ON s.id = cl.site_id
    WHERE i.id = NEW.inventory_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 트리거 등록 (used_parts INSERT 후 자동 실행)
CREATE TRIGGER trigger_log_inventory_change
AFTER INSERT ON used_parts
FOR EACH ROW
EXECUTE FUNCTION log_inventory_change();


-- =========================================================
-- [참고] 안전장치 - 재고 음수 방지 제약조건
-- =========================================================
-- inventories 테이블에 음수 방지 추가
ALTER TABLE inventories ADD CONSTRAINT chk_quantity_non_negative CHECK (quantity >= 0);

-- 차감 함수에도 검증 추가 (기존 deduct_inventory 함수 교체)
CREATE OR REPLACE FUNCTION deduct_inventory()
RETURNS TRIGGER AS $$
DECLARE
    current_qty INTEGER;
BEGIN
    -- 현재 재고 확인
    SELECT quantity INTO current_qty
    FROM inventories WHERE id = NEW.inventory_id;

    -- ★ 안전장치: 재고 부족 시 에러 발생 ★
    IF current_qty < NEW.used_amount THEN
        RAISE EXCEPTION '재고가 부족합니다. 부품 ID: %, 현재고: %, 요청량: %',
            NEW.inventory_id, current_qty, NEW.used_amount;
    END IF;

    -- 정상 차감
    UPDATE inventories
    SET quantity = quantity - NEW.used_amount,
        updated_at = NOW()
    WHERE id = NEW.inventory_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
