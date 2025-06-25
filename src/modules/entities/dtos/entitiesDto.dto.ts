import { ApiProperty } from '@nestjs/swagger';

export class EntryAttribute {
  @ApiProperty()
  value: String;

  @ApiProperty()
  name: String;

  @ApiProperty()
  id: String;
}

export class EntityAttribute {
  @ApiProperty()
  entityAttributeId: String;

  @ApiProperty()
  type: String;
}

export class EntryDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, isArray: true })
  synonyms: string[];

  @ApiProperty({ type: EntryAttribute, isArray: true })
  entryAttributes: EntryAttribute[];
}

export class EntitiesDto {
  @ApiProperty()
  workspaceId: string;

  @ApiProperty({ type: EntityAttribute, isArray: true })
  entityAttributes: EntityAttribute[];

  @ApiProperty()
  name: string;

  @ApiProperty()
  params: string;

  @ApiProperty({ type: EntryDto, isArray: true })
  entries: EntryDto[];
}
