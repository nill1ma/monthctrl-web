'use client'

import { useMounted } from '@/app/hooks/useMounted/useMounted';
import { useTheme } from '@/app/providers/ThemeProvider';
import Switch from '@/app/components/ui/Switch/Switch';

export default function ToggleSwitch() {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return null;
  }

  return (
    <Switch
      className="cursor-pointer"
      checked={resolvedTheme === 'dark'}
      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
    />
  );
}
