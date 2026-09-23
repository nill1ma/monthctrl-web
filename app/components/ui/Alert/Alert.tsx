import {Alert as AwakeUIAlert} from '@developmentsnil/awake-ui/alert'
import { ComponentProps } from 'react';

type AlertType = ComponentProps<typeof AwakeUIAlert>

export default function Alert({children, variant, className}: AlertType) {
  return <AwakeUIAlert variant={variant} className={className}>{children}</AwakeUIAlert>;
}