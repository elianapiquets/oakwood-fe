import * as z from 'zod';

const userSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address1: z.string().default(''),
  address2: z.string().default(''),
  address3: z.string().default(''),
  address4: z.string().default(''),
  city: z.string().default(''),
  zoneCode: z.string().default(''),
  territoryCode: z.string().default('US'),
  zip: z.string().default(''),
});

const companySchema = z.object({
  company: z.string().default(''),
  jobTitle: z.string().default(''),
  phone: z.string().default(''),
  extension: z.string().default(''),
  fax: z.string().default(''),
});

type UserFormValues = z.infer<typeof userSchema>;
type CompanyFormValues = z.infer<typeof companySchema>;

const US_STATE_OPTIONS = [
  {label: 'Alabama', value: 'AL'},
  {label: 'Alaska', value: 'AK'},
  {label: 'Arizona', value: 'AZ'},
  {label: 'Arkansas', value: 'AR'},
  {label: 'California', value: 'CA'},
  {label: 'Colorado', value: 'CO'},
  {label: 'Connecticut', value: 'CT'},
  {label: 'Delaware', value: 'DE'},
  {label: 'Florida', value: 'FL'},
  {label: 'Georgia', value: 'GA'},
  {label: 'Hawaii', value: 'HI'},
  {label: 'Idaho', value: 'ID'},
  {label: 'Illinois', value: 'IL'},
  {label: 'Indiana', value: 'IN'},
  {label: 'Iowa', value: 'IA'},
  {label: 'Kansas', value: 'KS'},
  {label: 'Kentucky', value: 'KY'},
  {label: 'Louisiana', value: 'LA'},
  {label: 'Maine', value: 'ME'},
  {label: 'Maryland', value: 'MD'},
  {label: 'Massachusetts', value: 'MA'},
  {label: 'Michigan', value: 'MI'},
  {label: 'Minnesota', value: 'MN'},
  {label: 'Mississippi', value: 'MS'},
  {label: 'Missouri', value: 'MO'},
  {label: 'Montana', value: 'MT'},
  {label: 'Nebraska', value: 'NE'},
  {label: 'Nevada', value: 'NV'},
  {label: 'New Hampshire', value: 'NH'},
  {label: 'New Jersey', value: 'NJ'},
  {label: 'New Mexico', value: 'NM'},
  {label: 'New York', value: 'NY'},
  {label: 'North Carolina', value: 'NC'},
  {label: 'North Dakota', value: 'ND'},
  {label: 'Ohio', value: 'OH'},
  {label: 'Oklahoma', value: 'OK'},
  {label: 'Oregon', value: 'OR'},
  {label: 'Pennsylvania', value: 'PA'},
  {label: 'Rhode Island', value: 'RI'},
  {label: 'South Carolina', value: 'SC'},
  {label: 'South Dakota', value: 'SD'},
  {label: 'Tennessee', value: 'TN'},
  {label: 'Texas', value: 'TX'},
  {label: 'Utah', value: 'UT'},
  {label: 'Vermont', value: 'VT'},
  {label: 'Virginia', value: 'VA'},
  {label: 'Washington', value: 'WA'},
  {label: 'West Virginia', value: 'WV'},
  {label: 'Wisconsin', value: 'WI'},
  {label: 'Wyoming', value: 'WY'},
];

const COUNTRY_OPTIONS = [
  {label: 'United States', value: 'US'},
  {label: 'Canada', value: 'CA'},
  {label: 'United Kingdom', value: 'GB'},
  {label: 'Australia', value: 'AU'},
  {label: 'Germany', value: 'DE'},
  {label: 'France', value: 'FR'},
  {label: 'Japan', value: 'JP'},
  {label: 'China', value: 'CN'},
  {label: 'India', value: 'IN'},
  {label: 'Mexico', value: 'MX'},
];

export { userSchema, companySchema, US_STATE_OPTIONS, COUNTRY_OPTIONS};
export type {UserFormValues, CompanyFormValues};
