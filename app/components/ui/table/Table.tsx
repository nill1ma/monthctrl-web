
import { Table as AwakeUITable } from '@developmentsnil/awake-ui/table';
import clsx from 'clsx';
import './styles.css';
import { ComponentProps } from 'react';

type TableProps = ComponentProps<typeof AwakeUITable.Root>
type TableHeaderProps = ComponentProps<typeof AwakeUITable.Head>
type TableBodyProps = ComponentProps<typeof AwakeUITable.Body>
type TableRowProps = ComponentProps<typeof AwakeUITable.Row>
type TableCellProps = ComponentProps<typeof AwakeUITable.Cell>
type TableHeaderCellProps = ComponentProps<typeof AwakeUITable.HeaderCell>

export function Table({ children, className, ...rest }: TableProps) {
  return <AwakeUITable.Root className={clsx('table', className)} {...rest}>{children}</AwakeUITable.Root>;
}

export function TableHeader({ children, className, ...rest }: TableHeaderProps) {
  return <AwakeUITable.Head className={className} {...rest}>{children}</AwakeUITable.Head>;
}

export function TableHeaderCell({ children, className, ...rest }: TableHeaderCellProps) {
  return <AwakeUITable.HeaderCell className={clsx('table-cell',className)} {...rest}>{children}</AwakeUITable.HeaderCell>;
}

export function TableBody({ children, className, ...rest }: TableBodyProps) {
  return <AwakeUITable.Body className={className} {...rest}>{children}</AwakeUITable.Body>;
}

export function TableRow({ children, className, ...rest }: TableRowProps) {
  return <AwakeUITable.Row className={className} {...rest}>{children}</AwakeUITable.Row>;
}

export function TableCell({ children, className, ...rest }: TableCellProps) {
  return <AwakeUITable.Cell className={clsx('table-cell', className)} {...rest}>{children}</AwakeUITable.Cell>;
}
