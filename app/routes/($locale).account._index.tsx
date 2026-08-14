import {useLoaderData, data} from 'react-router';
import type {Route} from './+types/account._index';
import {MyAccount} from '~/components/Account/MyAccount';

const CURRENT_ADDRESS_QUERY = `#graphql-customer-account
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

const UPDATE_ADDRESS_MUTATION = `#graphql-customer-account
  mutation UpdateAddress($addressId: ID!, $address: CustomerAddressInput!) {
    customerAddressUpdate(addressId: $addressId, address: $address) {
      customerAddress { id }
      userErrors { field message }
    }
  }
` as const;

const UPDATE_CUSTOMER_MUTATION = `#graphql-customer-account
  mutation UpdateCustomer($input: CustomerUpdateInput!) {
    customerUpdate(input: $input) {
      customer { firstName lastName }
      userErrors { field message }
    }
  }
` as const;

export async function action({request, context}: Route.ActionArgs) {
  const isLoggedIn = await context.customerAccount.isLoggedIn();
  if (!isLoggedIn) return context.customerAccount.login();

  const form = await request.formData();
  const section = String(form.get('_section') ?? '');
  const addressId = String(form.get('addressId') ?? '');
  const errors: string[] = [];

  const {data: current} = await context.customerAccount.query(
    CURRENT_ADDRESS_QUERY,
  );
  const currentAddr = current?.customer?.defaultAddress;

  const get = (key: string) => {
    const val = form.get(key);
    return val !== null && val !== '' ? String(val) : undefined;
  };

  if (section === 'user') {
    const firstName = get('firstName');
    const lastName = get('lastName');
    if (firstName ?? lastName) {
      const {data: customerData} = await context.customerAccount.mutate(
        UPDATE_CUSTOMER_MUTATION,
        {variables: {input: {firstName, lastName}}},
      );
      for (const e of customerData?.customerUpdate?.userErrors ?? []) {
        errors.push(e.message);
      }
    }

    if (addressId) {
      const {data: addressData} = await context.customerAccount.mutate(
        UPDATE_ADDRESS_MUTATION,
        {
          variables: {
            addressId,
            address: {
              address1: get('address1') ?? currentAddr?.address1 ?? '',
              address2: get('address2') ?? currentAddr?.address2 ?? '',
              city: get('city') ?? currentAddr?.city ?? '',
              zoneCode: get('zoneCode') ?? currentAddr?.zoneCode ?? '',
              territoryCode: get('territoryCode') ?? currentAddr?.territoryCode ?? '',
              zip: get('zip') ?? currentAddr?.zip ?? '',
              company: currentAddr?.company ?? '',
              phoneNumber: currentAddr?.phoneNumber ?? '',
            },
          },
        },
      );
      for (const e of addressData?.customerAddressUpdate?.userErrors ?? []) {
        errors.push(e.message);
      }
    }
  } else if (section === 'company') {
    if (addressId) {
      const {data: addressData} = await context.customerAccount.mutate(
        UPDATE_ADDRESS_MUTATION,
        {
          variables: {
            addressId,
            address: {
              address1: currentAddr?.address1 ?? '',
              address2: currentAddr?.address2 ?? '',
              city: currentAddr?.city ?? '',
              zoneCode: currentAddr?.zoneCode ?? '',
              territoryCode: currentAddr?.territoryCode ?? '',
              zip: currentAddr?.zip ?? '',
              company: get('company') ?? currentAddr?.company ?? '',
              phoneNumber: get('phone') ?? currentAddr?.phoneNumber ?? '',
            },
          },
        },
      );
      for (const e of addressData?.customerAddressUpdate?.userErrors ?? []) {
        errors.push(e.message);
      }
    }
  }

  if (errors.length) {
    return data({errors}, {status: 400});
  }

  return data({success: true});
}

export async function loader({context}: Route.LoaderArgs) {
  const isLoggedIn = await context.customerAccount.isLoggedIn();
  if (!isLoggedIn) return context.customerAccount.login();

  const {data} = await context.customerAccount.query(`
    query AccountInfo {
      customer {
        firstName
        lastName
        emailAddress { emailAddress }
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
        metafields(identifiers: [
          {namespace: "custom", key: "job_title"},
          {namespace: "custom", key: "phone_extension"},
          {namespace: "custom", key: "fax"}
        ]) {
          key
          value
        }
      }
    }
  `);

  return {customer: data?.customer};
}

export default function Account() {
  const loaderData = useLoaderData() as any;
  const customer = loaderData?.customer;

  return (
    <div className="w-full px-6 py-8">
      <MyAccount customer={customer} />
    </div>
  );
}
