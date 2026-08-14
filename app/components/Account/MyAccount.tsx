import {lazy, Suspense} from 'react';
import {Form} from 'react-router';

const UserInformation = lazy(() =>
  import('./UserInformation').then((m) => ({default: m.UserInformation})),
);

type CustomerAddress = {
  id: string;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  zoneCode?: string | null;
  territoryCode?: string | null;
  zip?: string | null;
  company?: string | null;
  phoneNumber?: string | null;
};

type CustomerMetafield = {
  key: string;
  value: string;
} | null;

type Customer = {
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: {emailAddress: string} | null;
  defaultAddress?: CustomerAddress | null;
  metafields?: CustomerMetafield[] | null;
};

type MyAccountProps = {
  customer?: Customer | null;
};

function MyAccount({customer}: MyAccountProps) {
  const email = customer?.emailAddress?.emailAddress ?? '';

  return (
    <div>
      <div className="bg-[#1e3a5f] rounded-lg px-6 py-5 mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold leading-tight !my-2">My Account</h1>
          <div className="text-white/50 text-sm mt-0.5">{email}</div>
        </div>
        <Form action="/account/logout" method="post">
          <button
            type="submit"
            className="text-sm text-white/70 border border-white/30 px-3 py-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          >
            Log out
          </button>
        </Form>
      </div>

      <Suspense fallback={null}>
        <UserInformation customer={customer} />
      </Suspense>
    </div>
  );
}

export {MyAccount};
