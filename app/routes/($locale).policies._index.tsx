import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/($locale).policies._index';
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import {getRootSeo} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo) ?? [];
};
import type {PoliciesQuery, PolicyItemFragment} from 'storefrontapi.generated';
import {getPathPrefix} from '~/lib/i18n';
import {POLICIES_QUERY} from '~/graphql/storefront/PoliciesQuery';

export async function loader({context}: Route.LoaderArgs) {
  const data: PoliciesQuery = await context.storefront.query(POLICIES_QUERY);

  const shopPolicies = data.shop;
  const policies: PolicyItemFragment[] = [
    shopPolicies?.privacyPolicy,
    shopPolicies?.shippingPolicy,
    shopPolicies?.termsOfService,
    shopPolicies?.refundPolicy,
    shopPolicies?.subscriptionPolicy,
  ].filter((policy): policy is PolicyItemFragment => policy != null);

  if (!policies.length) {
    throw new Response('No policies found', {status: 404});
  }

  const pathPrefix = getPathPrefix(context.storefront);
  const seo: SeoConfig = {
    title: 'Policies',
    url: `${pathPrefix}/policies`,
  };

  return {policies, seo};
}

export default function Policies() {
  const {policies} = useLoaderData<typeof loader>();

  return (
    <div className="policies">
      <h1>Policies</h1>
      <div>
        {policies.map((policy) => (
          <fieldset key={policy.id}>
            <Link to={`/policies/${policy.handle}`}>{policy.title}</Link>
          </fieldset>
        ))}
      </div>
    </div>
  );
}
