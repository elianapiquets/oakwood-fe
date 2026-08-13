import {useLoaderData} from 'react-router';
import type {Route} from './+types/account._index';
import {MyAccount} from '~/components/Account/MyAccount';

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
          {namespace: "custom", key: "fax"},
          {namespace: "custom", key: "address3"},
          {namespace: "custom", key: "address4"}
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
  const {customer} = useLoaderData<typeof loader>();

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <MyAccount customer={customer} />
    </div>
  );
}
