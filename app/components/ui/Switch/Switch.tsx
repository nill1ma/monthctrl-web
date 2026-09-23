import { Switch as AwakeUISwitch } from '@developmentsnil/awake-ui/switch';
import { ComponentProps } from 'react';

type SwitchProps = ComponentProps<typeof AwakeUISwitch>;

export default function Switch(props: SwitchProps) {
  return <AwakeUISwitch {...props} />;
}