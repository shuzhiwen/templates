import {Resolvers} from '@/generated'
import {authMutation} from './auth/mutation'
import {helloMutation, helloQuery, helloSubscription} from './hello'
import {dateScalar, jsonScalar, voidScalar} from './scalar'
import {transportQuery, transportSubscription} from './transport'

export * from './auth/jwt'

export const resolvers: Resolvers = {
  Date: dateScalar,
  Void: voidScalar,
  JSON: jsonScalar,
  Query: Object.assign(helloQuery, transportQuery),
  Mutation: Object.assign(helloMutation, authMutation),
  Subscription: Object.assign(helloSubscription, transportSubscription),
}
