import gql from "graphql-tag";

export const countStockTotalQuery = gql`
  query {
    data: countProducto
  }
`;

export const countClientesTotalQuery = gql`
  query {
    data: countCliente
  }
`;
