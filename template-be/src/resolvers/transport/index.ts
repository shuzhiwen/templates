import {
  MutationResolvers,
  QueryResolvers,
  SendDataInput,
  SubscriptionResolvers,
  Transport,
} from '@/generated'
import {PubSub, withFilter} from 'graphql-subscriptions'

const key = 'TRANSPORT'
const pubsub = new PubSub()
const cache: Map<string, {userIds: Set<string>; data: Transport[]}> = new Map()

export const transportQuery: QueryResolvers = {
  transportUsers: (_, args) => {
    return Array.from(cache.get(args.channelId)?.userIds ?? [])
  },

  transportHistory: (_, args) => {
    const {channelId} = args
    const offset = args.offset ?? 0
    const limit = args.limit ?? Infinity

    return (
      cache
        .get(channelId)
        ?.data.slice()
        .reverse()
        .slice(offset, offset + limit) ?? []
    )
  },
}

export const transportMutation: MutationResolvers = {
  enterChannel: (_, args) => {
    const {channelId, userId} = args.input
    const channel = cache.get(channelId) || {userIds: new Set(), data: []}

    channel.userIds.add(userId)
    channel.data.push({userId, data: 'enter', seq: 0})

    if (!cache.get(channelId)) {
      cache.set(channelId, channel)
      setTimeout(() => cache.delete(channelId), 24 * 60 * 60 * 1000)
    }

    return channel.userIds.size
  },

  exitChannel: (_, args) => {
    const {channelId, userId} = args.input
    const channel = cache.get(channelId)

    channel?.userIds.delete(userId)

    if (channel?.userIds.size === 0) {
      cache.delete(channelId)
    }

    return channel?.userIds.size ?? 0
  },

  sendData: (_, args) => {
    const {channelId, serialize, ...rest} = args.input
    const lastSeq = cache.get(channelId)?.data.slice(-1)[0]?.seq

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
