import { gql } from "@apollo/client";

export const GRAPH_QUERY = gql`
  query Graph($query: String!) {
    graph(query: $query) {
      center {
        id
        title
        authors
        year
        abstract
        tags
        links {
          doi
          pdf
        }
      }
      neighbors {
        id
        title
        authors
        year
        abstract
        tags
        links {
          doi
          pdf
        }
      }
      edges {
        source
        target
        relation
      }
    }
  }
`;
