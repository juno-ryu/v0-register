/**
 * Take Type & Order Channel Constants
 * 주문 유형 및 채널 관련 상수
 */

export const TAKE_TYPE_ENUM_CODE = {
  DELIVERY: 0,
  IN_STORE: 1,
  TAKE_AWAY: 2,
  COUNTER_PICKUP: 3,
  ROOM_DELIVERY: 4,
  OFFICE_DELIVERY: 5,
  KIOSK_ORDER: 6,
  PICKUP_AND_EAT_IN_STORE: 7,
  SMARTRO_KDS_ONLY: 8,
  THIRD_PARTY_DELIVERY: 9,
  TEMP_ORDER_FOR_PICKUP: 10,
  STAY_ORDER: 11,
} as const

export type TakeTypeEnumCodeValue = (typeof TAKE_TYPE_ENUM_CODE)[keyof typeof TAKE_TYPE_ENUM_CODE]

export const TAKE_TYPE_ENUM: Record<TakeTypeEnumCodeValue, string> = {
  0: '일반배달', // DELIVERY
  1: '테이블오더', // IN_STORE
  2: '테이크아웃', // TAKE_AWAY
  3: '카운터픽업', // COUNTER_PICKUP
  4: '로봇배달', // ROOM_DELIVERY
  5: '사내배달', // OFFICE_DELIVERY
  6: '키오스크', // KIOSK_ORDER
  7: '매장내식사', // PICKUP_AND_EAT_IN_STORE
  8: '스마트로KDS전용', // SMARTRO_KDS_ONLY
  9: '제3자서비스배달', // THIRD_PARTY_DELIVERY
  10: '임시주문픽업요청', // TEMP_ORDER_FOR_PICKUP
  11: '객실주문', // STAY_ORDER
}

export const ORDER_CHANNEL_FILTER_VALUES = {
  WEB_PG: 'WEB_PG',
  KIOSK: 'KIOSK',
  POS_PRE_PAY: 'POS_PRE_PAY',
  POS_POST_PAY: 'POS_POST_PAY',
} as const

export type OrderChannelFilterValue = (typeof ORDER_CHANNEL_FILTER_VALUES)[keyof typeof ORDER_CHANNEL_FILTER_VALUES]

export const ORDER_CHANNEL_TRANSLATION: Record<OrderChannelFilterValue, string> = {
  WEB_PG: '웹주문',
  KIOSK: '키오스크',
  POS_PRE_PAY: '포스(선불)',
  POS_POST_PAY: '포스(후불)',
}

export const ROBOT_DELIVERY_STATUS_TRANSLATION: Record<string, string> = {
  MATCHING: '배정 중',
  MATCHED: '배정 성공',
  PICKUP_STARTED: '상차지 출발',
  PICKUP_WAITING: '상차지 도착',
  DROPOFF_STARTED: '하차지 출발',
  DROPOFF_WAITING: '하차지 도착',
  DROPOFF_IN_PROGRESS: '하차중',
  COMPLETED: '완료',
  MATCHING_FAILED: '배정 실패',
  CANCELED: '취소',
  ABORTED: '강제 종료',
}
