import { type Component, type JSX, splitProps } from "solid-js";

import { cn } from "@/lib/utils";

type LabelProps = JSX.IntrinsicElements["label"];

const Label: Component<LabelProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <label
      data-slot="label"
      class={cn(
        "gap-2 text-sm leading-none font-medium group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed",
        local.class,
      )}
      {...rest}
    />
  );
};

export { Label };
