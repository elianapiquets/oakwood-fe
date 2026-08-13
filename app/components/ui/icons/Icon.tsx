import type { FunctionComponent, SVGProps } from 'react';

import { svgImports } from './svg-imports';

type IconName = keyof typeof svgImports;

type IconProps = {
  iconName: IconName;
  width?: number;
  height?: number;
  viewBox?: string;
  preserveAspectRatio?: string;
  className?: string;
  strokeWidth?: string;
};

const isIconValid = (nameOfIcon: string | IconName): nameOfIcon is IconName =>
  nameOfIcon in svgImports;

/**
 * Icon component for rendering SVG icons.
 *
 * @param props - The properties for the Icon component.
 * @param props.iconName - The name of the SVG icon to render. This should match a key in the `svgImports` object. Also Asset Name in Figma
 * @param props.width - The width of the icon (ratio will be kept). Defaults to the width specified in the SVG file.
 * @param props.height - The height of the icon (ratio will be kept). Defaults to the height specified in the SVG file.
 * @param props.viewBox='0 0 24 24' - The viewBox attribute of the SVG. Defaults to '0 0 24 24'.
 * @param props.preserveAspectRatio='xMaxYMax meet' - The preserveAspectRatio attribute of the SVG. Defaults to 'xMaxYMax meet'.
 * @param props.className - Additional CSS classes to apply to the SVG element. You can change the color of the icon with className. Just start typing icon-fill-color- or icon-stroke-color- and a dropdown will appear. They will be the colors available in theme.
 *
 * @returns The rendered SVG icon component.
 *
 * @throws Error If the specified iconName does not exist in the `svgImports` object.
 */
const Icon = ({
  iconName,
  width,
  height,
  preserveAspectRatio = 'xMaxYMax meet',
  viewBox = '0 0 24 24',
  className,
  strokeWidth = '1.125',
}: IconProps) => {
  if (!isIconValid(iconName)) {
    throw new Error(`Icon ${iconName} does not exist`);
  }

  const svgXml = svgImports[iconName];

  const IconSvg = svgXml as unknown as FunctionComponent<SVGProps<SVGElement>>;

  return (
    <IconSvg
      viewBox={viewBox}
      width={width}
      height={height}
      preserveAspectRatio={preserveAspectRatio}
      className={className}
      strokeWidth={strokeWidth}
    />
  );
};

export { Icon };
export type { IconName, IconProps };
