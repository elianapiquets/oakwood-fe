import {Form, useLoaderData} from 'react-router';
import type {Route} from './+types/account._index';

export async function loader({context}: Route.LoaderArgs) {
  const isLoggedIn = await context.customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return context.customerAccount.login();
  }

  const {data} = await context.customerAccount.query(`
    query AccountInfo {
      customer {
        firstName
        lastName
        emailAddress { emailAddress }
      }
    }
  `);

  return {customer: data?.customer};
}

export default function Account() {
  const {customer} = useLoaderData<typeof loader>();

  return (
    <div className="account-page">
      <h1>My Account</h1>
      <p>
        {customer?.firstName} {customer?.lastName}
      </p>
      <p>{customer?.emailAddress?.emailAddress}</p>
      <Form method="post" action="/account/logout">
        <button type="submit" className="size-btn size-btn-order">
          Sign Out
        </button>
      </Form>
    </div>
  );
}
