
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

function MyAccount({ customer }: MyAccountProps) {
  const email = customer?.emailAddress?.emailAddress ?? '';

  return (
    <div>
      <div className="bg-[#1e3a5f] rounded-lg px-6 py-5 flex items-center justify-between mb-4">
        <div>
          <h1 className="text-white text-2xl font-bold leading-tight">My Account</h1>
          <div className="text-white/50 text-sm mt-0.5">{email}</div>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-md transition-colors whitespace-nowrap"
        >
          Edit Account Info
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg px-5 py-4 text-[#1e3a5f] text-sm space-y-2.5">
        <div>
          If you are an existing customer, please contact us to set up your online account.
        </div>
        <div>
          {'If you are a new customer, please complete the '}
          <a href="/pages/account-application" className="underline font-medium">
            Account Application
          </a>
          {' and complete customer registration. You may be contacted for further information before your order will be processed.'}
        </div>
      </div>
    </div>
  );
}

export {MyAccount};