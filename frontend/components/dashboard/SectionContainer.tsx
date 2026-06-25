import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  id: string;
};

export default function SectionContainer({
  children,
  className = "",
  id,
}: Props) {
  return (
    <section id={id} className={`mb-8 ${className}`}>
      {children}
    </section>
  );
}
