import {useState, useEffect} from 'react';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm, type SubmitHandler} from 'react-hook-form';
import {useFetcher} from 'react-router';
import {ConfigProvider} from 'antd';

import {Form, createHandledFormElement} from '~/components/ui/Form';
import {BASE_FORM_CONFIG} from '~/lib/form';
import {
  userSchema,
  companySchema,
  US_STATE_OPTIONS,
  COUNTRY_OPTIONS,
  type UserFormValues,
  type CompanyFormValues,
} from './constants';

type CustomerMetafield = {key: string; value: string} | null;

type Customer = {
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
  metafields?: CustomerMetafield[] | null;
};

type UserInformationProps = {
  customer?: Customer | null;
};

const UserFormItem = createHandledFormElement<typeof Form.Item, UserFormValues>(Form.Item);
const CompanyFormItem = createHandledFormElement<typeof Form.Item, CompanyFormValues>(Form.Item);

function SectionButtons({
  isEditing,
  isPending,
  onEdit,
  onCancel,
  onSave,
}: {
  isEditing: boolean;
  isPending: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className="text-sm text-[#1e3a5f] border border-[#1e3a5f] px-3 py-1.5 rounded hover:bg-[#1e3a5f] hover:text-white transition-colors"
      >
        Edit
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="text-sm border border-gray-300 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={isPending}
        className="text-sm bg-[#1e3a5f] text-white px-3 py-1.5 rounded disabled:opacity-60 hover:bg-[#162d4a] transition-colors"
      >
        {isPending ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

function UserInformation({customer}: UserInformationProps) {
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);

  const fetcher = useFetcher();
  const addr = customer?.defaultAddress;
  const email = customer?.emailAddress?.emailAddress ?? '';
  
  const metaMap: Record<string, string> = {};
  for (const m of customer?.metafields ?? []) {
    if (m) metaMap[m.key] = m.value;
  }

  const isPending = fetcher.state !== 'idle';

  const methodsUser = useForm<UserFormValues>({
    ...BASE_FORM_CONFIG,
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: customer?.firstName ?? '',
      lastName: customer?.lastName ?? '',
      address1: addr?.address1 ?? '',
      address2: addr?.address2 ?? '',
      city: addr?.city ?? '',
      zoneCode: addr?.zoneCode ?? '',
      territoryCode: addr?.territoryCode ?? 'US',
      zip: addr?.zip ?? '',
    },
  });

  const methodsCompany = useForm<CompanyFormValues>({
    ...BASE_FORM_CONFIG,
    resolver: zodResolver(companySchema),
    defaultValues: {
      company: addr?.company ?? '',
      jobTitle: metaMap.job_title ?? '',
      phone: addr?.phoneNumber ?? '',
      extension: metaMap.phone_extension ?? '',
      fax: metaMap.fax ?? '',
    },
  });

  useEffect(() => {
    methodsUser.reset({
      firstName: customer?.firstName ?? '',
      lastName: customer?.lastName ?? '',
      address1: addr?.address1 ?? '',
      address2: addr?.address2 ?? '',
      city: addr?.city ?? '',
      zoneCode: addr?.zoneCode ?? '',
      territoryCode: addr?.territoryCode ?? 'US',
      zip: addr?.zip ?? '',
    });
    methodsCompany.reset({
      company: addr?.company ?? '',
      jobTitle: metaMap.job_title ?? '',
      phone: addr?.phoneNumber ?? '',
      extension: metaMap.phone_extension ?? '',
      fax: metaMap.fax ?? '',
    });
  }, [customer]);

  const onSubmitUser: SubmitHandler<UserFormValues> = (values) => {
    const formData = new FormData();
    formData.append('_section', 'user');
    if (addr?.id) formData.append('addressId', addr.id);
    for (const [key, val] of Object.entries(values)) {
      formData.append(key, String(val ?? ''));
    }
    fetcher.submit(formData, {method: 'post'});
    setIsEditingUser(false);
  };

  const onSubmitCompany: SubmitHandler<CompanyFormValues> = (values) => {
    const formData = new FormData();
    formData.append('_section', 'company');
    if (addr?.id) formData.append('addressId', addr.id);
    for (const [key, val] of Object.entries(values)) {
      formData.append(key, String(val ?? ''));
    }
    fetcher.submit(formData, {method: 'post'});
    setIsEditingCompany(false);
  };

  return (
    <ConfigProvider
      theme={{
        token: {fontFamily: 'Outfit, sans-serif'},
      }}
    >
    <div className="flex flex-col gap-4">
      {/* User Information */}
      <Form
        key={'info'}
        methods={methodsUser}
        onSubmit={methodsUser.handleSubmit(onSubmitUser)}
        className="border border-gray-200 rounded-lg p-6 grid grid-cols-2 gap-x-6 gap-y-4"
      >
        <div className="col-span-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[#1e3a5f] font-bold text-base">User Information</h2>
            {isEditingUser ? (
              <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full">
                editing
              </span>
            ) : <></>}
          </div>
          <SectionButtons
            isEditing={isEditingUser}
            isPending={isPending}
            onEdit={() => setIsEditingUser(true)}
            onCancel={() => { methodsUser.reset(); setIsEditingUser(false); }}
            onSave={methodsUser.handleSubmit(onSubmitUser)}
          />
        </div>

        {isEditingUser ? (
          <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-[#1e3a5f] text-sm">
            {'Please do not use characters such as ~ @ $ % & * ( ) . ! , [ ] or {} in address or name fields.'}
          </div>
        ) : <></>}

        <UserFormItem name="firstName">
          <Form.Input placeholder="FIRST NAME" disabled={!isEditingUser} />
          <Form.Error />
        </UserFormItem>

        <UserFormItem name="lastName">
          <Form.Input placeholder="LAST NAME" disabled={!isEditingUser} />
          <Form.Error />
        </UserFormItem>

        <UserFormItem name="address1">
          <Form.Input placeholder="ADDRESS LINE 1" disabled={!isEditingUser} />
          <Form.Error />
        </UserFormItem>

        <UserFormItem name="address2">
          <Form.Input placeholder="APT, SUITE, ETC." disabled={!isEditingUser} />
          <Form.Error />
        </UserFormItem>

        <UserFormItem name="city">
          <Form.Input placeholder="CITY" disabled={!isEditingUser} />
          <Form.Error />
        </UserFormItem>

        <UserFormItem name="zoneCode">
          <Form.Select placeholder="STATE" options={US_STATE_OPTIONS} disabled={!isEditingUser} />
          <Form.Error />
        </UserFormItem>

        <UserFormItem name="territoryCode">
          <Form.Select placeholder="COUNTRY" options={COUNTRY_OPTIONS} disabled={!isEditingUser} />
          <Form.Error />
        </UserFormItem>

        <UserFormItem name="zip">
          <Form.Input placeholder="POSTAL CODE" disabled={!isEditingUser} />
          <Form.Error />
        </UserFormItem>

        <div className="col-span-2">
          <Form.Input placeholder="EMAIL ADDRESS" value={email} onChange={() => {}} disabled />
        </div>

        {isEditingUser ? (
          <div className="col-span-2">
            <button
              type="button"
              className="border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded hover:bg-gray-50 transition-colors"
            >
              Change Password
            </button>
          </div>
        ) : <></>}

      </Form>

      {/* Company Information */}
      <Form
        key={'company'}
        methods={methodsCompany}
        onSubmit={methodsCompany.handleSubmit(onSubmitCompany)}
        className="border border-gray-200 rounded-lg p-6 grid grid-cols-2 gap-x-6 gap-y-4"
      >
        <div className="col-span-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[#1e3a5f] font-bold text-base">Company Information</h2>
            {isEditingCompany ? (
              <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full">
                editing
              </span>
            ) : <></>}
          </div>
          <SectionButtons
            isEditing={isEditingCompany}
            isPending={isPending}
            onEdit={() => setIsEditingCompany(true)}
            onCancel={() => { methodsCompany.reset(); setIsEditingCompany(false); }}
            onSave={methodsCompany.handleSubmit(onSubmitCompany)}
          />
        </div>

        <CompanyFormItem name="company">
          <Form.Input placeholder="COMPANY NAME" disabled={!isEditingCompany} />
          <Form.Error />
        </CompanyFormItem>

        <CompanyFormItem name="jobTitle">
          <Form.Input placeholder="TITLE" disabled={!isEditingCompany} />
          <Form.Error />
        </CompanyFormItem>

        <CompanyFormItem name="phone">
          <Form.Input placeholder="TELEPHONE" type="tel" disabled={!isEditingCompany} />
          <Form.Error />
        </CompanyFormItem>

        <CompanyFormItem name="extension">
          <Form.Input placeholder="EXTENSION" disabled={!isEditingCompany} />
          <Form.Error />
        </CompanyFormItem>

        <CompanyFormItem name="fax">
          <Form.Input placeholder="FAX" disabled={!isEditingCompany} />
          <Form.Error />
        </CompanyFormItem>

      </Form>
    </div>
    </ConfigProvider>
  );
}

export {UserInformation};
