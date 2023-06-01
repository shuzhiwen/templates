import {
  MutationResolvers,
  QueryResolvers,
  SendDataInput,
  SubscriptionResolvers,
  Transport,
} from '@generated'
import {PubSub, withFilter} from 'graphql-subscriptions'

const key = 'TRANSPORT'
const pubsub = new PubSub()
const cache: Map<string, {userIds: Set<string>; data: Transport[]}> = new Map()

export const transportQuery: QueryResolvers = {
  transportUserCount: (_, args) => {
    return cache.get(args.channelId)?.userIds.size ?? null
  },

  transportHistory: (_, args) => {
    return cache.get(args.channelId)?.data ?? []
  },
}

export const transportMutation: MutationResolvers = {
  enterChannel: (_, args) => {
    const {channelId, userId} = args.input

    if (!cache.get(channelId)) {
      cache.set(channelId, {userIds: new Set(), data: []})
    }

    cache.get(channelId)!.userIds.add(userId)

    setTimeout(() => cache.delete(channelId), 24 * 60 * 60 * 1000)

    return true
  },

  exitChannel: (_, args) => {
    const {channelId, userId} = args.input

    cache.get(channelId)?.userIds.delete(userId)

    if (cache.get(channelId)?.userIds.size === 0) {
      cache.delete(channelId)
    }

    return true
  },

  sendData: (_, args) => {
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
    resolve: (payload: SendDataInput) => payload,
    subscribe: (_, args) => ({
      [Symbol.asyncIterator]: withFilter(
        () => pubsub.asyncIterator([key]),
        async (payload: Promise<SendDataInput>) => {
          return args.channelId === (await payload).channelId
        }
      ),
    }),
  },
}
