import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

const link = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? "http://localhost:8000/graphql",
});

export const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});
