import { LabeledDivider } from '@/components/ui';

type Props = { label: string };

/** Sosyal giriş ile e-posta formunu ayıran etiketli kural. */
export function AuthDivider({ label }: Props) {
  return <LabeledDivider label={label} />;
}
