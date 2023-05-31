import {
  MutationResolvers,
  QueryResolvers,
  SubscriptionResolvers,
  Transport,
  TransportInput,
} from '@generated'
import {PubSub, withFilter} from 'graphql-subscriptions'

const key = 'TRANSPORT'
const pubsub = new PubSub()
const cache: Map<string, {userIds: Set<string>; data: Transport[]}> = new Map()

export const transportQuery: QueryResolvers = {
  transportUserCount: (_, args) => {
    return cache.get(args.input.id)?.userIds.size ?? null
  },

  transportHistory: (_, args) => {
    return cache.get(args.input.id)?.data ?? []
  },
}

export const transportMutation: MutationResolvers = {
  transportLogin: (_, args) => {
    const {channelId, userId} = args.input

    if (!cache.get(channelId)) {
      cache.set(channelId, {userIds: new Set(), data: []})
    }

    cache.get(channelId)!.userIds.add(userId)

    return true
  },

  transport: (_, args) => {
    const {userId, channelId, data} = args.input

    if (!cache.get(channelId)) {
      return false
    }

    cache.get(channelId)!.data.push({userId, data})
    pubsub.publish(key, args.input)

    return true
  },
}

export const transportSubscription: SubscriptionResolvers = {
  transport: {
    resolve: (payload: TransportInput) => payload,
    subscribe: (_, args) => ({
      [Symbol.asyncIterator]: withFilter(
        () => pubsub.asyncIterator([key]),
        async (payload: Promise<TransportInput>) => {
          return args.input.id === (await payload).channelId
        }
      ),
    }),
  },
}
