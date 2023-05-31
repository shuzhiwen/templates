import {GraphQLScalarType, Kind} from 'graphql'

export const voidScalar = new GraphQLScalarType({
  name: 'Void',
  description: 'Void custom scalar type',
  serialize() {
    return undefined
  },
  parseValue() {
    return undefined
  },
  parseLiteral() {
    return undefined
  },
})

export const dateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    return value
  },
  parseValue(value) {
    return value
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return ast.value
    }
    return null
  },
})

export const jsonScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value) {
    return value
  },
  parseValue(value) {
    return value
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.OBJECT) {
      return ast
    }
    return null
  },
})
