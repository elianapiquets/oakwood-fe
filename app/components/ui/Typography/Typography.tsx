import type { ReactNode, ElementType } from 'react';

type TypographyProps = {
  className?: string;
  children: ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
};

const Title = ({ className, children, level = 1 }: TypographyProps) => {
  const Tag: ElementType = `h${level}`;

  return <Tag className={className}>{children}</Tag>;
};

const Text = ({ className, children }: TypographyProps) => (
  <span className={className}>{children}</span>
);

const Paragraph = ({ className, children }: TypographyProps) => (
  <p className={className}>{children}</p>
);

const Typography = ({ className, children }: TypographyProps) => (
  <span className={className}>{children}</span>
);

Typography.Paragraph = Paragraph;

Typography.Text = Text;

Typography.Title = Title;

export { Typography };
export type { TypographyProps };
