import { ApiProperty } from '@nestjs/swagger';
import { Extensions, ScriptType } from 'kissbot-core';

export class LogoDto {
  @ApiProperty()
  transparent: string;

  @ApiProperty()
  original: string;
}

export class LayoutSettingsDto {
  @ApiProperty({ type: LogoDto, isArray: false })
  logo: LogoDto;

  @ApiProperty()
  color: string;

  @ApiProperty()
  title: string;
}

export class ResponseDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  icon: string;

  @ApiProperty()
  action: string;
}

export class ResponseOptionsDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ isArray: true, type: ResponseDto })
  responses: ResponseDto[];
}

export class ResponseTypesDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  icon: string;

  @ApiProperty({ type: ResponseOptionsDto, isArray: false })
  options: ResponseOptionsDto;
}

export class ScriptsDto {
  @ApiProperty({ enum: ScriptType, required: true, type: ScriptType })
  type: ScriptType;

  @ApiProperty()
  data: string;
}

export class StylesDto {
  @ApiProperty()
  path: string;
}

export class HelpCenterDto {
  @ApiProperty()
  url: string;

  @ApiProperty()
  articles: { [key: string]: string };
}

export class OrganizationExtensionsDto {
  @ApiProperty({ enum: Extensions, required: true, type: Extensions })
  extension: Extensions;

  @ApiProperty()
  enable: boolean;
}

export class OrganizationSettingsDto {
  @ApiProperty()
  organizationId?: string;

  @ApiProperty({ isArray: true, required: false, type: OrganizationExtensionsDto })
  extensions?: OrganizationExtensionsDto[];

  @ApiProperty({ type: LayoutSettingsDto, isArray: false })
  layout?: LayoutSettingsDto;

  @ApiProperty({ isArray: true, required: false, type: ResponseTypesDto })
  responses?: ResponseTypesDto[];

  @ApiProperty({ isArray: true, required: false, type: ScriptsDto })
  scripts?: ScriptsDto[];

  @ApiProperty({ isArray: true, required: false, type: StylesDto })
  styles?: StylesDto[];

  @ApiProperty({ required: false, type: HelpCenterDto })
  helpCenter: HelpCenterDto;
}
