import { Pagination as AwakeUIPagination } from '@developmentsnil/awake-ui/pagination';
import { ComponentProps } from 'react';

type PaginationProps = ComponentProps<typeof AwakeUIPagination>;

export default function Pagination(props: PaginationProps) {
  return <AwakeUIPagination {...props} />;
}