/**
 * 결제 수단 상수 - 레거시 payment-constants.ts 포팅
 */

export const PAYMENT_CODE: Record<string, string> = {
  creditcard: '신용카드',
  naverpay: '네이버페이',
  toss: '토스페이',
  samsungpay: '삼성페이',
  kakaopay: '카카오페이',
  payco: '페이코',
  cellphone: '휴대폰',
  bank: '계좌이체',
  vbank: '가상계좌',
  pinpay: '핀페이',
  brand_pay: '브랜드페이',
  brand_money: '브랜드머니',
  else: '기타',
}
