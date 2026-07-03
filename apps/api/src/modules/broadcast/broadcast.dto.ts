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
  | 'vip';

export class CreateBroadcastDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsString() @IsNotEmpty()
  message: string;

  @IsIn(['all', 'pending', 'confirmed', 'completed_30d', 'inactive_30d', 'vip'])
  audienceKey: AudienceKey;

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
  @IsOptional() @IsIn(['all', 'pending', 'confirmed', 'completed_30d', 'inactive_30d', 'vip'])
  audienceKey?: AudienceKey;
  @IsOptional() @IsEnum(['ONCE', 'WEEKLY']) repeatType?: 'ONCE' | 'WEEKLY';
  @IsOptional() @IsArray() @IsString({ each: true }) scheduleDays?: string[];
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) scheduleTime?: string;
  @IsOptional() @IsDateString() oneOffDate?: string;
}
