import gql from "graphql-tag";

export const requestPushNotificationQuery = gql`
  query ($entity: NotificacionPushInput!) {
    data: requestPushNotification(
      entity: $entity
    )
  }
`;
