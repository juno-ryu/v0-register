import { z } from 'zod'

// ─────────────────────────────────────────────
// 목록 조회 파라미터
// ─────────────────────────────────────────────
export const ordersListParamsSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  page: z.number().default(1),
  per_page: z.number().default(20),
  orderSn: z.string().nullable().optional(),
  employeeNumber: z.string().nullable().optional(),
  takeTypeIn: z.union([z.string(), z.array(z.number())]).nullable().optional(),
  orderChannelIn: z.union([z.string(), z.array(z.string())]).nullable().optional(),
  storeIdIn: z.union([z.string(), z.array(z.string())]).nullable().optional(),
  brandIdIn: z.union([z.string(), z.array(z.string())]).nullable().optional(),
  statusIn: z.union([z.string(), z.array(z.string())]).nullable().optional(),
})

export type OrdersListParams = z.infer<typeof ordersListParamsSchema>

// ─────────────────────────────────────────────
// 목록 응답 - results 내 개별 주문 (flatten 후)
// ─────────────────────────────────────────────
export const orderItemSchema = z.object({
  id: z.string(),
  sn: z.string(),
  storeName: z.string().nullable().optional(),
  brandName: z.string().nullable().optional(),
  menuTitle: z.string().nullable().optional(),
  paidDt: z.string().nullable().optional(),
  takeType: z.number().nullable().optional(),
  status: z.number(),
  orderChannel: z.string().nullable().optional(),
  totalBareAmount: z.number().default(0),
  totalDiscountAmount: z.number().default(0),
  requestAmount: z.number().default(0),
  employeeNumber: z.string().nullable().optional(),
  ordererInfo: z
    .object({
      tableName: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
})

export type OrderItem = z.infer<typeof orderItemSchema>

export const ordersListResponseSchema = z.object({
  count: z.number(),
  results: z.array(orderItemSchema),
  totalSalesAmount: z.number().optional(),
})

export type OrdersListResponse = z.infer<typeof ordersListResponseSchema>

// ─────────────────────────────────────────────
// 주문 상세 응답
// ─────────────────────────────────────────────
export const orderDetailSchema = z.object({
  id: z.string(),
  sn: z.string().nullable().optional(),
  external_sn: z.string().nullable().optional(),
  external_smartro_pos_sn: z.string().nullable().optional(),
  paid_dt: z.string().nullable().optional(),
  status: z.number(),
  take_type: z.number().nullable().optional(),
  order_channel: z.string().nullable().optional(),
  delivery_address: z.string().nullable().optional(),
  robot_delivery_status: z.string().nullable().optional(),
  menu_title: z.string().nullable().optional(),
  brand_id: z.string().nullable().optional(),
  brand_name: z.string().nullable().optional(),
  store_sn: z.string().nullable().optional(),
  store_name: z.string().nullable().optional(),
  customer_name: z.string().nullable().optional(),
  customer_phone: z.string().nullable().optional(),
  customer_type: z.number().nullable().optional(),
  employee_number: z.string().nullable().optional(),
  payment_code: z.string().nullable().optional(),
  request_amount: z.number().nullable().optional(),
  cancel_amount: z.number().nullable().optional(),
  payment_cancelled_dt: z.string().nullable().optional(),
  payment_data: z
    .object({
      AUTH_NO: z.string().nullable().optional(),
      CARD_ACQ_NAME: z.string().nullable().optional(),
      CARD_NO: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  orderer_info: z
    .object({
      table_name: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
})

export type OrderDetail = z.infer<typeof orderDetailSchema>

// ─────────────────────────────────────────────
// 주문 메뉴 옵션 응답
// ─────────────────────────────────────────────
export const orderMenuOptionSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  base_price: z.number(),
  quantity: z.number(),
  id: z.number(),
})

export const orderMenuDiscountSchema = z.object({
  name: z.string(),
  amount: z.number(),
})

export const orderMenuSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  base_price: z.number(),
  quantity: z.number(),
  total_price: z.number(),
  id: z.number(),
  order_menu_options: z.array(orderMenuOptionSchema),
  discount: orderMenuDiscountSchema.nullable().optional(),
})

export const usedCouponSchema = z.object({
  sn: z.string().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  discount_type: z.string(),
  discount_amount: z.number(),
  manual_discount_amount: z.number().optional(),
  max_discount_amount: z.number(),
})

export const orderMenuOptionsResponseSchema = z.object({
  id: z.string(),
  sn: z.string().nullable().optional(),
  paid_dt: z.string().nullable().optional(),
  order_menus: z.array(orderMenuSchema),
  total_bare_amount: z.number(),
  discount_membership_amount: z.number().optional(),
  discount_coupon_amount: z.number().optional(),
  used_coupons: z.array(usedCouponSchema).optional(),
  store_comment: z.string().nullable().optional(),
  delivery_comment: z.string().nullable().optional(),
})

export type OrderMenuOptionsResponse = z.infer<typeof orderMenuOptionsResponseSchema>

// ─────────────────────────────────────────────
// 주문 취소 파라미터
// ─────────────────────────────────────────────
export const cancelOrderParamsSchema = z.object({
  id: z.string(),
  cancelType: z.number(),
  cancelReason: z.string().optional(),
})

export type CancelOrderParams = z.infer<typeof cancelOrderParamsSchema>
