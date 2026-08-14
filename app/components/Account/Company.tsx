import {useState, useEffect} from 'react';
import {useFetcher} from 'react-router';

type Company = {id: string; name: string};

type CompanyProps = {
  customerId?: string | null;
  allCompanies: Company[];
  memberCompanyIds: Set<string>;
  savedCompanyId: string | null;
};

function Company({customerId, allCompanies, memberCompanyIds, savedCompanyId}: CompanyProps) {
  const fetcher = useFetcher();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(savedCompanyId);
  const [persistedCompanyId, setPersistedCompanyId] = useState<string | null>(savedCompanyId);

  useEffect(() => {
    setSelectedCompanyId(savedCompanyId);
    setPersistedCompanyId(savedCompanyId);
  }, [savedCompanyId]);

  const isPending = fetcher.state !== 'idle';
  const companySelectionDirty = selectedCompanyId !== persistedCompanyId;

  const handleSave = () => setPersistedCompanyId(selectedCompanyId);

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <fetcher.Form method="post" onSubmit={handleSave}>
        <input type="hidden" name="_section" value="company_selection" />
        <input type="hidden" name="companyId" value={selectedCompanyId ?? ''} />
        <input type="hidden" name="customerId" value={customerId ?? ''} />

<div className="flex items-center justify-between mb-4">
          <h2 className="text-[#1e3a5f] font-bold text-base">Company</h2>
          <div className="flex items-center gap-2">
            {companySelectionDirty && (
              <button
                type="button"
                onClick={() => setSelectedCompanyId(persistedCompanyId)}
                className="text-sm border border-gray-300 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
            {companySelectionDirty && (
              <button
                type="submit"
                disabled={isPending || !selectedCompanyId}
                className="text-sm bg-[#1e3a5f] text-white px-3 py-1.5 rounded disabled:opacity-60 hover:bg-[#162d4a] transition-colors"
              >
                {isPending ? 'Saving…' : 'Save'}
              </button>
            )}
            <button
              type="button"
              className="text-sm text-[#1e3a5f] border border-[#1e3a5f] px-3 py-1.5 rounded hover:bg-[#1e3a5f] hover:text-white transition-colors"
            >
              Create a new company
            </button>
          </div>
        </div>

        {allCompanies.length === 0 ? (
          <p className="text-sm text-gray-400">No companies found.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {allCompanies.map((company) => {
              const isSelected = selectedCompanyId === company.id;
              const isMember = memberCompanyIds.has(company.id);
              return (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => setSelectedCompanyId(isSelected ? null : company.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                    isSelected
                      ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      isSelected ? 'border-[#1e3a5f] bg-[#1e3a5f]' : 'border-gray-300'
                    }`}
                  />
                  <span className="text-sm font-medium flex-1">{company.name}</span>
                  {isMember && (
                    <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                      member
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </fetcher.Form>
    </div>
  );
}

export {Company};
