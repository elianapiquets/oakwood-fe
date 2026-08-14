import {lazy, Suspense} from 'react';
import {Form} from 'react-router';

const UserInformation = lazy(() =>
  import('./UserInformation').then((m) => ({default: m.UserInformation})),
);

const Company = lazy(() =>
  import('./Company').then((m) => ({default: m.Company})),
);

type CustomerMetafield = {key: string; value: string} | null;

type CompanyContact = {
  id: string;
  company: {id: string; name: string};
};

type Customer = {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: {emailAddress: string} | null;
  defaultAddress?: {
    id: string;
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    zoneCode?: string | null;
    territoryCode?: string | null;
    zip?: string | null;
    company?: string | null;
    phoneNumber?: string | null;
  } | null;
  companyContacts?: {nodes: CompanyContact[]} | null;
  metafields?: CustomerMetafield[] | null;
};

type BackendCompany = {id: string; name: string};

type MyAccountProps = {
  customer?: Customer | null;
  allCompanies?: BackendCompany[];
};

function MyAccount({customer, allCompanies = []}: MyAccountProps) {
  const email = customer?.emailAddress?.emailAddress ?? '';

  const memberCompanyIds = new Set(
    (customer?.companyContacts?.nodes ?? []).map((c) => c.company.id),
  );

  const metaMap: Record<string, string> = {};
  for (const m of customer?.metafields ?? []) {
    if (m) metaMap[m.key] = m.value;
  }
  const savedCompanyId = metaMap.active_company_id ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[#1e3a5f] rounded-lg px-6 py-5 flex items-center justify-between">
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
        <Company
          customerId={customer?.id}
          allCompanies={allCompanies}
          memberCompanyIds={memberCompanyIds}
          savedCompanyId={savedCompanyId}
        />
      </Suspense>
    </div>
  );
}

export {MyAccount};
