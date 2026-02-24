import { type ComponentProps } from "solid-js";
import { Toaster as Sonner } from "solid-sonner";

type ToasterProps = ComponentProps<typeof Sonner>;

function Toaster(props: ToasterProps) {
  return <Sonner class="toaster group" {...props} />;
}

export { Toaster };
