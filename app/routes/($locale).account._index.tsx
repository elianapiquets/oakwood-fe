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

const SET_ACTIVE_COMPANY_MUTATION = `#graphql-customer-account
  mutation SetActiveCompany($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      userErrors { code field message }
    }
  }
` as const;


export async function action({request, context}: Route.ActionArgs) {
  const isLoggedIn = await context.customerAccount.isLoggedIn();
  if (!isLoggedIn) return context.customerAccount.login();

  const form = await request.formData();
  const section = String(form.get('_section') ?? '');
  const errors: string[] = [];

  const get = (key: string) => {
    const val = form.get(key);
    return val !== null && val !== '' ? String(val) : undefined;
  };

  if (section === 'company_selection') {
    const companyId = get('companyId');
    const customerId = get('customerId');
    if (companyId && customerId) {
      const {data: result} = await context.customerAccount.mutate(
        SET_ACTIVE_COMPANY_MUTATION,
        {
          variables: {
            metafields: [{
              ownerId: customerId,
              namespace: 'custom',
              key: 'active_company_id',
              value: companyId,
              type: 'single_line_text_field',
            }],
          },
        },
      );
      for (const e of result?.metafieldsSet?.userErrors ?? []) {
        errors.push(e.message);
      }
    }
  } else if (section === 'user') {
    const addressId = String(form.get('addressId') ?? '');

    const {data: current} = await context.customerAccount.query(CURRENT_ADDRESS_QUERY);
    const currentAddr = current?.customer?.defaultAddress;

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
  }

  if (errors.length) {
    return data({errors}, {status: 400});
  }

  return data({success: true});
}

export async function loader({context}: Route.LoaderArgs) {
  const isLoggedIn = await context.customerAccount.isLoggedIn();
  if (!isLoggedIn) return context.customerAccount.login();

  const env = context.env as Record<string, string>;
  const backendUrl = env.BACKEND_URL ?? '';
  const backendApiKey = env.BACKEND_API_KEY ?? '';

  const [{data}, companiesRes] = await Promise.all([
    context.customerAccount.query(`
      query AccountInfo {
        customer {
          id
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
          companyContacts(first: 50) {
            nodes {
              id
              company { id name }
              locations(first: 10) {
                nodes {
                  roleAssignments(first: 10) {
                    nodes {
                      role { name }
                      contact { id }
                    }
                  }
                }
              }
            }
          }
          metafields(identifiers: [
            {namespace: "custom", key: "job_title"},
            {namespace: "custom", key: "phone_extension"},
            {namespace: "custom", key: "fax"},
            {namespace: "custom", key: "active_company_id"}
          ]) {
            key
            value
          }
        }
      }
    `),
    fetch(`${backendUrl}/api/companies`, {
      headers: {'x-api-key': backendApiKey},
    }).then((r) => r.json()).catch(() => []),
  ]);

  const allCompanies = Array.isArray(companiesRes) ? companiesRes : [];

  return {customer: data?.customer, allCompanies};
}

export default function Account() {
  const loaderData = useLoaderData() as any;
  const customer = loaderData?.customer;
  const allCompanies = loaderData?.allCompanies ?? [];

  return (
    <div className="w-full px-6 py-8">
      <MyAccount customer={customer} allCompanies={allCompanies} />
    </div>
  );
}
