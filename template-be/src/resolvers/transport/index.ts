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
    const {channelId} = args
    const offset = args.offset ?? 0
    const limit = args.limit ?? Infinity

    return cache.get(channelId)?.data.slice(offset, offset + limit) ?? []
  },
}

export const transportMutation: MutationResolvers = {
  enterChannel: (_, args) => {
    const {channelId, userId} = args.input

    if (!cache.get(channelId)) {
      cache.set(channelId, {userIds: new Set(), data: []})
    }

    cache.get(channelId)!.userIds.add(userId)
    cache.get(channelId)!.data.push({userId, data: 'enter', seq: 0})

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
    const {channelId, serialize, ...rest} = args.input
    const lastSeq = cache.get(channelId)?.data.at(-1)?.seq

    if (serialize && lastSeq !== rest.seq - 1) {
      return false
    }

    cache.get(channelId)?.data.push(rest)
    pubsub.publish(key, args.input)

    return true
  },
}

export const transportSubscription: SubscriptionResolvers = {
  receiveData: {
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
