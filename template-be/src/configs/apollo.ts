import http from 'http'
import {WebSocketServer} from 'ws'
import {Disposable} from 'graphql-ws'
import {useServer} from 'graphql-ws/lib/use/ws'
import {koaMiddleware} from '@as-integrations/koa'
import {addMocksToSchema} from '@graphql-tools/mock'
import {makeExecutableSchema} from '@graphql-tools/schema'
import {ApolloServer, ApolloServerPlugin} from '@apollo/server'
import {ApolloServerPluginDrainHttpServer} from '@apollo/server/plugin/drainHttpServer'
import {buildClientSchema} from 'graphql'
import {introspection} from '../generated'
import {resolvers} from '../resolvers'

function AutoClosePlugin(disposable: Disposable): ApolloServerPlugin {
  return {
    async serverWillStart() {
      return {
        async drainServer() {
          await disposable.dispose()
        },
      }
    },
  }
}

export async function createApolloServer(httpServer: http.Server) {
  const schema = makeExecutableSchema({
    typeDefs: buildClientSchema(introspection),
    resolvers,
  })
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  })
  const apolloServer = new ApolloServer<ApolloContext>({
    schema: addMocksToSchema({schema, preserveResolvers: true}),
    plugins: [
      ApolloServerPluginDrainHttpServer({httpServer}),
      AutoClosePlugin(useServer({schema}, wsServer)),
    ],
  })

  await apolloServer.start()

  return koaMiddleware<ApolloContext>(apolloServer, {
    context: async ({ctx}) => ({
      token: ctx.headers.authorization?.split(' ')[1],
    }),
  })
}
