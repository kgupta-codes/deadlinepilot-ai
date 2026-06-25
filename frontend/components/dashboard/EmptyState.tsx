type Props = {
  message: string;
};

export default function EmptyState({ message }: Props) {
  return <p className="text-sm text-gray-400">{message}</p>;
}
