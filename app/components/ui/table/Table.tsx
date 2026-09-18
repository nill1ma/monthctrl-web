
import './styles.css';
import * as AwakeUITable from '@developmentsnil/awake-ui/table'



export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return <AwakeUITable.Root className={`table ${className || ''}`}>{children}</AwakeUITable.Root>;
}

export function TableHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <AwakeUITable.Head className={`${className || ''}`}>{children}</AwakeUITable.Head>;
}

export function TableBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <AwakeUITable.Body className={`${className || ''}`}>{children}</AwakeUITable.Body>;
}

export function TableRow({ children, className, onClick, onMouseEnter, onMouseLeave }: { children: React.ReactNode; className?: string; onClick?: () => void; onMouseEnter?: () => void; onMouseLeave?: () => void }) {
  return <AwakeUITable.Row onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} className={`${className || ''}`}>{children}</AwakeUITable.Row>;
}

export function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <AwakeUITable.Cell className={`table-cell ${className || ''}`}>{children}</AwakeUITable.Cell>;
}
