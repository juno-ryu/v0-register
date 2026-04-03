import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import type { FieldValues } from 'react-hook-form'

/**
 * zodResolver 타입 래퍼
 *
 * Zod v4의 z.default() / z.coerce 사용 시 input ≠ output 타입이 되어
 * RHF v7.71의 Resolver<T, ctx, TTransformedValues>와 충돌하는 이슈 (resolvers#813).
 * 해당 패키지에서 수정되기 전까지 이 함수로 일관되게 처리한다.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function typedZodResolver<T extends FieldValues>(schema: any): Resolver<T> {
  return zodResolver(schema) as unknown as Resolver<T>
}
