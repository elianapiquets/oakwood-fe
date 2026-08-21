import * as React from "react"

import { cn } from "~/lib/utils"

/*
 * Wrapped in `forwardRef`, unlike the file shadcn generates.
 *
 * shadcn targets React 19, where `ref` is an ordinary prop and a plain function
 * component receives it in `...props`. This project is on React 18.3, where
 * React strips `ref` before props — so the generated version silently drops it.
 * react-hook-form's `register()` needs that ref to read the field at submit;
 * without it an untouched field resolves to `undefined` rather than its default,
 * and zod rejects it with "expected string, received undefined".
 *
 * Re-apply this when regenerating the component, until the project is on React 19.
 */

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
})

export { Textarea }
