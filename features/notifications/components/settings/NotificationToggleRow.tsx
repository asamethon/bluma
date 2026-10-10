import { ListRow, Switch } from '@/components/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { SettingRow, ToggleKey } from './notificationRows';

type Props = {
  row: SettingRow;
  checked: boolean;
  disabled: boolean;
  last?: boolean;
  onChange: (key: ToggleKey, value: boolean) => void;
};

export const NotificationToggleRow = memo(function NotificationToggleRow(props: Props) {
  const { t } = useTranslation();
  const { row } = props;

  return (
    <ListRow
      icon={row.icon}
      title={t(row.title)}
      subtitle={t(row.caption)}
      disabled={props.disabled}
      divider={!props.last}
      right={
        <Switch
          checked={props.checked}
          onChange={value => props.onChange(row.key, value)}
          disabled={props.disabled}
        />
      }
    />
  );
});
