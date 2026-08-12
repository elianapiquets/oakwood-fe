import {useLoaderData} from 'react-router';
import type {Route} from './+types/pages.$handle';
import {fetchPage} from '~/lib/backend';

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `Oakwood Chemical | ${data?.page.title ?? ''}`}];
};

export async function loader({params}: Route.LoaderArgs) {
  if (!params.handle) throw new Error('Missing page handle');

  const page = await fetchPage(params.handle);
  if (!page) throw new Response('Not Found', {status: 404});

  return {page};
}

export default function Page() {
  const {page} = useLoaderData<typeof loader>();

  return (
    <div className="page">
      <header>
        <h1>{page.title}</h1>
      </header>
      <main dangerouslySetInnerHTML={{__html: page.body}} />
    </div>
  );
}
