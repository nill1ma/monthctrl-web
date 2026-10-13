'use client'

import { useMounted } from '@/app/hooks/useMounted/useMounted';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Switch } from '@developmentsnil/awake-ui/switch';

export default function ToggleSwitch() {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return null;
  }

  return (
    <Switch
      checked={resolvedTheme === 'dark'}
      className="rounded-full"
      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
    />
  );
}
