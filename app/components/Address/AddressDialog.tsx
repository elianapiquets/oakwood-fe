import {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui';
import {AddressFields} from './AddressFields';
import {
  ADDRESS_DEFAULTS,
  addressSchema,
  type AddressValues,
} from './constants';

/**
 * Add/edit one address.
 *
 * Owns its own `useForm`, deliberately separate from whatever form it's opened
 * from: Save then validates only the address, and cancelling a half-filled
 * dialog leaves the parent untouched. `onSave` hands the validated values up;
 * persisting them is the caller's business.
 *
 * `title` carries the whole label ("Add billing address", "Edit shipping
 * address") so one component covers every case.
 */
export function AddressDialog({
  open,
  onOpenChange,
  title,
  value,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Existing address to edit; omit to start empty. */
  value?: AddressValues | null;
  onSave: (address: AddressValues) => void;
}) {
  const methods = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: value ?? ADDRESS_DEFAULTS,
  });

  // Re-seed on open so a cancelled edit doesn't leave stale input behind, and
  // so reopening reflects what was actually saved.
  useEffect(() => {
    if (open) methods.reset(value ?? ADDRESS_DEFAULTS);
  }, [open, value, methods]);

  const onSubmit = methods.handleSubmit((address) => {
    onSave(address);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <AddressFields methods={methods} />

        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-sm text-slate-600 underline"
          >
            Cancel
          </button>
          {/*
            `type="button"`, not submit: this dialog renders inside the location
            form, and a submit button would submit *that* form instead. The
            address form is driven through its own handleSubmit.
          */}
          <button
            type="button"
            onClick={() => void onSubmit()}
            className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white"
          >
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
