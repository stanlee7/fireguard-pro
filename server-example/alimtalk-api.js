/**
 * =========================================================
 * FireGuard Pro — 알림톡 자동 발송 백엔드 (Solapi 기준)
 * =========================================================
 *
 * 실제 프로덕션에서 사용할 Node.js Express 기반 알림톡 API 예시입니다.
 *
 * [필수 사전 준비]
 * 1. Solapi 회원가입 → https://solapi.com
 * 2. 카카오 비즈니스 채널 개설 → https://business.kakao.com
 * 3. Solapi에서 카카오 채널 연동 + 알림톡 템플릿 등록/심사 통과
 * 4. API Key & Secret 발급
 *
 * [설치]
 *   npm install express solapi dotenv
 *
 * [환경 변수 (.env)]
 *   SOLAPI_API_KEY=your_api_key
 *   SOLAPI_API_SECRET=your_api_secret
 *   SOLAPI_PFID=KA01PF_your_channel_id
 *   SOLAPI_TEMPLATE_INSPECTION=TKxxxxxx
 *   SOLAPI_TEMPLATE_LOW_STOCK=TKyyyyyy
 */

require('dotenv').config();
const express = require('express');
const { SolapiMessageService } = require('solapi');

const app = express();
app.use(express.json());

// Solapi 클라이언트 초기화
const messageService = new SolapiMessageService(
    process.env.SOLAPI_API_KEY,
    process.env.SOLAPI_API_SECRET
);

/**
 * ==========================================
 * POST /api/notifications/send-alimtalk
 * ==========================================
 *
 * 점검일지 제출 후 프론트에서 호출하는 엔드포인트.
 * 두 종류의 알림톡을 자동으로 발송합니다:
 *   1) 점검 완료 요약본 (항상)
 *   2) 부품 교체 필요 안내 (재고 부족 시에만)
 *
 * Request Body:
 * {
 *   site: { name, managerName, managerPhone },
 *   inspectorName: "홍길동",
 *   checkDate: "2026-04-19",
 *   details: "1층~3층 소화기 점검 완료",
 *   usedParts: [{ partName: "소화기", amount: 2 }],
 *   lowStockParts: [{ partName: "소화기", quantity: 3, minimumStock: 10 }]
 * }
 */
app.post('/api/notifications/send-alimtalk', async (req, res) => {
    try {
        const { site, inspectorName, checkDate, details, usedParts, lowStockParts } = req.body;

        // ── 유효성 검사 ──
        if (!site?.managerPhone || !inspectorName) {
            return res.status(400).json({
                success: false,
                error: '필수 정보가 누락되었습니다 (담당자 연락처, 점검자 이름)'
            });
        }

        const results = [];

        // ── 1. 점검 완료 요약본 발송 ──
        const partsText = usedParts?.length > 0
            ? usedParts.map(p => `${p.partName}: ${p.amount}개 교체`).join(', ')
            : '교체 부품 없음';

        try {
            const summaryResult = await messageService.send({
                to: site.managerPhone.replace(/-/g, ''),  // 하이픈 제거
                from: '02-1234-5678',  // 발신번호 (사전 등록 필수)
                kakaoOptions: {
                    pfId: process.env.SOLAPI_PFID,
                    templateId: process.env.SOLAPI_TEMPLATE_INSPECTION,
                    // 템플릿 변수 (Solapi 템플릿에 등록한 변수명과 일치해야 함)
                    variables: {
                        '#{담당자명}': site.managerName,
                        '#{현장명}': site.name,
                        '#{점검일}': checkDate,
                        '#{점검자}': inspectorName,
                        '#{점검내용}': details || '정기 점검',
                        '#{교체부품}': partsText,
                    }
                }
            });

            results.push({
                type: 'inspection_summary',
                status: 'success',
                messageId: summaryResult.groupId,
                recipient: site.managerPhone,
            });

            console.log(`✅ 점검 요약 알림톡 발송 완료: ${site.managerName} (${site.managerPhone})`);
        } catch (err) {
            console.error('❌ 점검 요약 알림톡 발송 실패:', err.message);
            results.push({
                type: 'inspection_summary',
                status: 'failed',
                error: err.message,
            });
        }

        // ── 2. 부품 교체 필요 안내 (재고 부족 시에만) ──
        if (lowStockParts?.length > 0) {
            const lowStockText = lowStockParts
                .map(p => `⚠️ ${p.partName}: 잔여 ${p.quantity}개 (기준 ${p.minimumStock}개)`)
                .join('\n');

            try {
                const lowStockResult = await messageService.send({
                    to: site.managerPhone.replace(/-/g, ''),
                    from: '02-1234-5678',
                    kakaoOptions: {
                        pfId: process.env.SOLAPI_PFID,
                        templateId: process.env.SOLAPI_TEMPLATE_LOW_STOCK,
                        variables: {
                            '#{담당자명}': site.managerName,
                            '#{현장명}': site.name,
                            '#{부족품목}': lowStockText,
                            '#{부족개수}': `${lowStockParts.length}`,
                        }
                    }
                });

                results.push({
                    type: 'low_stock_alert',
                    status: 'success',
                    messageId: lowStockResult.groupId,
                    recipient: site.managerPhone,
                    lowStockCount: lowStockParts.length,
                });

                console.log(`🚨 부품 교체 알림톡 발송 완료: ${lowStockParts.length}건 부족`);
            } catch (err) {
                console.error('❌ 부품 교체 알림톡 발송 실패:', err.message);
                results.push({
                    type: 'low_stock_alert',
                    status: 'failed',
                    error: err.message,
                });
            }
        }

        // ── 결과 응답 ──
        res.json({
            success: true,
            message: '알림톡 발송이 완료되었습니다.',
            results,
            sentAt: new Date().toISOString(),
        });

    } catch (error) {
        console.error('💥 알림톡 API 서버 오류:', error);
        res.status(500).json({
            success: false,
            error: '서버 오류가 발생했습니다.',
            details: error.message,
        });
    }
});


/**
 * ==========================================
 *  알림톡 템플릿 예시
 * ==========================================
 *
 *  ── 템플릿 1: 점검 완료 요약본 ──
 *  (Solapi 대시보드에서 아래 내용으로 등록 후 심사 받기)
 *
 *  [FireGuard Pro] 점검 완료 안내
 *
 *  안녕하세요 #{담당자명}님,
 *  #{현장명}의 소방 점검이 완료되었습니다.
 *
 *  📋 점검 요약
 *  • 점검일: #{점검일}
 *  • 점검자: #{점검자}
 *  • 점검 내용: #{점검내용}
 *
 *  🔧 교체 부품
 *  #{교체부품}
 *
 *  감사합니다.
 *
 *
 *  ── 템플릿 2: 부품 교체 필요 안내 ──
 *
 *  [FireGuard Pro] 부품 교체 필요 안내
 *
 *  #{담당자명}님,
 *  아래 #{부족개수}건의 부품 재고가 적정 기준 이하입니다.
 *  빠른 발주를 부탁드립니다.
 *
 *  🚨 부족 품목
 *  #{부족품목}
 *
 *  자동 발주를 원하시면 아래 버튼을 눌러주세요.
 *
 *  감사합니다.
 *
 */


/**
 * ==========================================
 *  대안 API: NHN Cloud 알림톡
 * ==========================================
 *
 *  Solapi 대신 NHN Cloud(토스트)를 사용할 경우의 API 호출 예시입니다.
 *  NHN Cloud 알림톡은 REST API 기반으로 동작합니다.
 *
 *  [NHN Cloud 설정]
 *  1. NHN Cloud 콘솔 → Notification → KakaoTalk Bizmessage 활성화
 *  2. 카카오 발신 프로필 등록
 *  3. 알림톡 템플릿 등록 & 심사
 *  4. SecretKey 발급
 */
async function sendAlimTalkViaNHN(templateCode, recipientPhone, variables) {
    const NHN_APP_KEY = process.env.NHN_APP_KEY;
    const NHN_SECRET_KEY = process.env.NHN_SECRET_KEY;
    const NHN_SENDER_KEY = process.env.NHN_SENDER_KEY;

    const response = await fetch(
        `https://api-alimtalk.cloud.toast.com/alimtalk/v2.3/appkeys/${NHN_APP_KEY}/messages`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-Secret-Key': NHN_SECRET_KEY,
            },
            body: JSON.stringify({
                senderKey: NHN_SENDER_KEY,
                templateCode: templateCode,
                recipientList: [{
                    recipientNo: recipientPhone.replace(/-/g, ''),
                    templateParameter: variables,
                }],
            }),
        }
    );

    return await response.json();
}


// ── 서버 시작 ──
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🔥 FireGuard Pro 알림톡 API 서버 실행 중: http://localhost:${PORT}`);
});
