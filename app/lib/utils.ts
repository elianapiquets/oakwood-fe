import {clsx, type ClassValue} from 'clsx';
import {extendTailwindMerge} from 'tailwind-merge';

/**
 * Lives at `app/lib/utils.ts` so shadcn components can be pasted in unchanged —
 * they all import `{cn} from '@/lib/utils'`. The `@/*` alias maps to `app/*` in
 * both tsconfig.json (for TypeScript) and vite.config.ts (for the bundler);
 * both are required, or you get a build that fails while typecheck passes.
 *
 * Moved here from `app/components/ui/cn.ts`, implementation unchanged.
 */
const twMerge = extendTailwindMerge({
  extend: {},
});

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export {cn};
