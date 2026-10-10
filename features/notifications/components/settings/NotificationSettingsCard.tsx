import { SettingsGroup } from '@/components/ui';
import { NotificationToggleRow } from './NotificationToggleRow';
import type { SettingRow, ToggleKey } from './notificationRows';

type Props = {
  title: string;
  rows: SettingRow[];
  settings: Record<ToggleKey, boolean>;
  disabled: boolean;
  onChange: (key: ToggleKey, value: boolean) => void;
};

export function NotificationSettingsCard({ title, rows, settings, disabled, onChange }: Props) {
  return (
    <SettingsGroup title={title}>
      {rows.map((row, index) => (
        <NotificationToggleRow
          key={row.key}
          row={row}
          checked={settings[row.key]}
          disabled={disabled}
          last={index === rows.length - 1}
          onChange={onChange}
        />
      ))}
    </SettingsGroup>
  );
}
