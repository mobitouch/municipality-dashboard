import * as React from "react";
import { Link as RouterLink } from "react-router";

type LinkProps = Omit<React.ComponentProps<"a">, "href"> & { href: string };

/**
 * An anchor that navigates client-side. It keeps the `href` prop the screens
 * were written with and forwards everything else, so it still composes with
 * `asChild` triggers (Button, DropdownMenuItem).
 */
export function Link({ href, ref, ...props }: LinkProps) {
  return <RouterLink to={href} ref={ref} {...props} />;
}
