import type {UseFormReturn} from 'react-hook-form';

import {Form} from '~/components/ui';
import {AddressAutocomplete} from './AddressAutocomplete';
import {US_STATE_OPTIONS, COUNTRY_OPTIONS} from '~/constants';
import type {AddressValues} from './constants';

/**
 * The address field set, without any dialog chrome — so the same fields can be
 * rendered inline wherever that suits better than a modal.
 *
 * Takes `methods` rather than creating its own form, so the caller decides
 * whether the address is a standalone form (as in `AddressDialog`) or part of a
 * larger one.
 */
export function AddressFields({
  methods,
}: {
  methods: UseFormReturn<AddressValues>;
}) {
  return (
    <Form as="div" methods={methods} className="flex flex-col gap-3">
      <Form.Item name="countryCode">
        <Form.Label label="Country/region" colon={false} />
        <Form.Select id="countryCode" options={COUNTRY_OPTIONS} />
        <Form.Error />
      </Form.Item>

      <div className="grid grid-cols-2 gap-3">
        <Form.Item name="firstName">
          <Form.Label label="First name" colon={false} />
          <Form.Input id="firstName" />
          <Form.Error />
        </Form.Item>

        <Form.Item name="lastName">
          <Form.Label label="Last name" colon={false} />
          <Form.Input id="lastName" />
          <Form.Error />
        </Form.Item>
      </div>

      <Form.Item name="recipient">
        <Form.Label label="Company/attention" colon={false} />
        <Form.Input id="recipient" />
        <Form.Error />
      </Form.Item>

      {/* Owns its own Form.Item: picking a suggestion writes to the sibling
          city/state/ZIP fields, which needs the form, not just this field. */}
      <AddressAutocomplete methods={methods} />

      <Form.Item name="address2">
        <Form.Label label="Apartment, suite, etc (optional)" colon={false} />
        <Form.Input id="address2" />
        <Form.Error />
      </Form.Item>

      <div className="grid grid-cols-3 gap-3">
        <Form.Item name="city">
          <Form.Label label="City" colon={false} required />
          <Form.Input id="city" />
          <Form.Error />
        </Form.Item>

        <Form.Item name="zoneCode">
          <Form.Label label="State" colon={false} required />
          <Form.Select id="zoneCode" options={US_STATE_OPTIONS} />
          <Form.Error />
        </Form.Item>

        <Form.Item name="zip">
          <Form.Label label="ZIP code" colon={false} required />
          <Form.Input id="zip" />
          <Form.Error />
        </Form.Item>
      </div>

      {/* Plain text for now — `CompanyAddressInput.phone` is a String, so the
          flag/country picker from the design can be layered on later without
          changing what gets stored. */}
      <Form.Item name="phone">
        <Form.Label label="Phone" colon={false} />
        <Form.Input id="phone" type="tel" />
        <Form.Error />
      </Form.Item>
    </Form>
  );
}
