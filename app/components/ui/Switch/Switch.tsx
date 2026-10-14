import { Switch as AwakeUISwitch } from '@developmentsnil/awake-ui/switch';
import { ComponentProps } from 'react';

type SwitchRootProps = ComponentProps<typeof AwakeUISwitch.Root>;
type SwitchThumbProps = ComponentProps<typeof AwakeUISwitch.Thumb>;

function Root(props: SwitchRootProps) {
  return <AwakeUISwitch.Root {...props} />;
}

function Thumb(props: SwitchThumbProps) {
  return <AwakeUISwitch.Thumb {...props} />;
}

export const Switch = { Root, Thumb };
