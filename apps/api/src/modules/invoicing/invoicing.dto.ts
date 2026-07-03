import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class SaveTemplateDto {
  @IsOptional() @IsString()  accentColor?: string;
  @IsOptional() @IsString()  businessName?: string;
  @IsOptional() @IsString()  tagline?: string;
  @IsOptional() @IsString()  footerText?: string;
  @IsOptional() @IsBoolean() showLogo?: boolean;
}
