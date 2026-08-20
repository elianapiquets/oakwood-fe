import {useLoaderData} from 'react-router';
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import type {Route} from './+types/($locale).account.orders.$id';
import {getRootSeo} from '~/lib/seo';
import {orderParamToGid} from '~/lib/orders';
import {OrderDetailHeader} from '~/components/Account/OrderDetailHeader';
import {OrderDetailLineItems} from '~/components/Account/OrderDetailLineItems';
import {OrderDetailSummary} from '~/components/Account/OrderDetailSummary';
import {getPathPrefix} from '~/lib/i18n';
import {ORDER_QUERY} from '~/graphql/customer-account/OrderDetailQuery';

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo) ?? [];
};

export async function loader({context, params}: Route.LoaderArgs) {
  const {customerAccount, storefront} = context;

  if (!(await customerAccount.isLoggedIn())) {
    throw await customerAccount.login();
  }

  if (!params.id) {
    throw new Response('Order not found', {status: 404});
  }

  const {data, errors} = await customerAccount.query(ORDER_QUERY, {
    // The route param carries the whole trailing GID segment, `?key=…`
    // included, because the Customer Account API needs it back verbatim.
    variables: {orderId: orderParamToGid(params.id)},
  });

  const order = data?.order;
  if (!order || errors?.length) {
    throw new Response('Order not found', {status: 404});
  }

  const pathPrefix = getPathPrefix(storefront);
  const seo: SeoConfig = {
    title: `Order ${order.name}`,
    url: `${pathPrefix}/account/orders/${params.id}`,
  };

  return {order, seo};
}

export default function OrderDetailPage() {
  const {order} = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-8">
      <OrderDetailHeader order={order} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <OrderDetailLineItems lineItems={order.lineItems?.nodes ?? []} />
        <OrderDetailSummary order={order} />
      </div>
    </div>
  );
}
