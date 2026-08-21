import * as z from 'zod';

const userSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address1: z.string(),
  address2: z.string(),
  city: z.string(),
  zoneCode: z.string(),
  territoryCode: z.string(),
  zip: z.string(),
});

type UserFormValues = z.infer<typeof userSchema>;

export {userSchema};
export type {UserFormValues};
