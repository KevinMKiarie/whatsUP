import {
  IsArray, IsDateString, IsEnum, IsIn, IsNotEmpty,
  IsOptional, IsString, Matches,
} from 'class-validator';

export type AudienceKey =
  | 'all'
  | 'pending'
  | 'confirmed'
  | 'completed_30d'
  | 'inactive_30d'
  | 'vip'
  | 'custom';

export class CreateBroadcastDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsString() @IsNotEmpty()
  message: string;

  @IsIn(['all', 'pending', 'confirmed', 'completed_30d', 'inactive_30d', 'vip', 'custom'])
  audienceKey: AudienceKey;

  @IsOptional() @IsArray() @IsString({ each: true })
  customPhones?: string[];

  @IsEnum(['ONCE', 'WEEKLY'])
  repeatType: 'ONCE' | 'WEEKLY';

  @IsOptional() @IsArray() @IsString({ each: true })
  scheduleDays?: string[];

  @IsOptional() @Matches(/^\d{2}:\d{2}$/)
  scheduleTime?: string;

  @IsOptional() @IsDateString()
  oneOffDate?: string;
}

export class UpdateBroadcastDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() message?: string;
  @IsOptional() @IsIn(['all', 'pending', 'confirmed', 'completed_30d', 'inactive_30d', 'vip', 'custom'])
  audienceKey?: AudienceKey;
  @IsOptional() @IsArray() @IsString({ each: true })
  customPhones?: string[];
  @IsOptional() @IsEnum(['ONCE', 'WEEKLY']) repeatType?: 'ONCE' | 'WEEKLY';
  @IsOptional() @IsArray() @IsString({ each: true }) scheduleDays?: string[];
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) scheduleTime?: string;
  @IsOptional() @IsDateString() oneOffDate?: string;
}
