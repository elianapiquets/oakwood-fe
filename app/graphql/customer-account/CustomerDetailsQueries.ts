// Reads and writes for the /account page: the customer's current address,
// their profile, and the active-company metafield.

export const CURRENT_ADDRESS_QUERY = `#graphql-customer-account
  query CurrentAddress {
    customer {
      defaultAddress {
        id
        address1
        address2
        city
        zoneCode
        territoryCode
        zip
        company
        phoneNumber
      }
    }
  }
` as const;

export const UPDATE_ADDRESS_MUTATION = `#graphql-customer-account
  mutation UpdateAddress($addressId: ID!, $address: CustomerAddressInput!) {
    customerAddressUpdate(addressId: $addressId, address: $address) {
      customerAddress { id }
      userErrors { field message }
    }
  }
` as const;

export const UPDATE_CUSTOMER_MUTATION = `#graphql-customer-account
  mutation UpdateCustomer($input: CustomerUpdateInput!) {
    customerUpdate(input: $input) {
      customer { firstName lastName }
      userErrors { field message }
    }
  }
` as const;

export const SET_ACTIVE_COMPANY_MUTATION = `#graphql-customer-account
  mutation SetActiveCompany($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      userErrors { code field message }
    }
  }
` as const;
