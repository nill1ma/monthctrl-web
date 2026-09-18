
import "./styles.css";
import {Button as AwakeUIButton} from '@developmentsnil/awake-ui/button'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  cursor?: "pointer" | "default" | "not-allowed";
  className?: string;
};

export default function Button({ children, variant = "primary", cursor = "pointer", className = "", ...props }: ButtonProps) {
  return <AwakeUIButton className={`button button--${variant} cursor-${cursor} ${className}`} {...props}>{children}</AwakeUIButton>;
}