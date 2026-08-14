import {Link} from 'react-router';
import heroImage from '~/assets/home-hero.png';

export function HomeHero() {
  return (
    <div
      className="relative flex min-h-[520px] w-full items-center bg-navy-dark bg-cover bg-center px-10 py-16"
      style={{backgroundImage: `url(${heroImage})`}}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent" />
      <div className="relative z-10 max-w-xl">
        <p className="text-xs font-bold uppercase tracking-widest text-teal">
          Now Available
        </p>
        <h1 className="mt-3 text-6xl font-black uppercase leading-none text-white">
          Dry
          <br />
          Solvents.
        </h1>
        <p className="mt-4 text-lg italic text-slate-200">
          Dry Means Dry &mdash; Engineered to remove moisture with uncompromising
          accuracy.
        </p>
        <Link
          to="/collections/anhydrous-solvents"
          className="mt-6 inline-block rounded bg-teal px-6 py-3 text-sm font-bold !text-white hover:bg-teal-dark"
        >
          Shop Anhydrous Solvents
        </Link>
      </div>
    </div>
  );
}
