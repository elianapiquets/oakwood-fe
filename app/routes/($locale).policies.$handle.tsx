import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/($locale).policies.$handle';
import {type Shop} from '@shopify/hydrogen/storefront-api-types';
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import {getRootSeo} from '~/lib/seo';
import {getPathPrefix} from '~/lib/i18n';
import {POLICY_CONTENT_QUERY} from '~/graphql/storefront/PolicyQueries';

type SelectedPolicies = keyof Pick<
  Shop,
  'privacyPolicy' | 'shippingPolicy' | 'termsOfService' | 'refundPolicy'
>;

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo) ?? [];
};

export async function loader({params, context}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Response('No handle was passed in', {status: 404});
  }

  const policyName = params.handle.replace(
    /-([a-z])/g,
    (_: unknown, m1: string) => m1.toUpperCase(),
  ) as SelectedPolicies;

  const data = await context.storefront.query(POLICY_CONTENT_QUERY, {
    variables: {
      privacyPolicy: false,
      shippingPolicy: false,
      termsOfService: false,
      refundPolicy: false,
      [policyName]: true,
      language: context.storefront.i18n?.language,
    },
  });

  const policy = data.shop?.[policyName];

  if (!policy) {
    throw new Response('Could not find the policy', {status: 404});
  }

  const pathPrefix = getPathPrefix(context.storefront);
  const seo: SeoConfig = {
    title: policy.title,
    url: `${pathPrefix}/policies/${policy.handle}`,
  };

  return {policy, seo};
}

export default function Policy() {
  const {policy} = useLoaderData<typeof loader>();

  return (
    <div className="policy">
      <br />
      <br />
      <div>
        <Link to="/policies">← Back to Policies</Link>
      </div>
      <br />
      <h1>{policy.title}</h1>
      <div dangerouslySetInnerHTML={{__html: policy.body}} />
    </div>
  );
}
