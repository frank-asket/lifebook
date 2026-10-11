import { Module, Controller, Get, Injectable, UnauthorizedException, Headers, Put, Body } from '@nestjs/common';
import { PrismaClient, FaithJourney } from '@prisma/client';
import { verifyToken } from '@clerk/backend';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@Injectable()
class Database extends PrismaClient {}
@Injectable()
class Identity {
  async subject(authorization?: string): Promise<string> {
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('Bearer token required');
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) throw new UnauthorizedException('Clerk not configured');
    try {
      const token = authorization.slice(7);
      const payload = await verifyToken(token, { secretKey, authorizedParties: (process.env.CLERK_AUTHORIZED_PARTIES || '').split(',').map(s => s.trim()).filter(Boolean) });
      if (!payload.sub) throw new Error('Missing subject');
      return payload.sub;
    } catch { throw new UnauthorizedException('Invalid access token'); }
  }
}
class ProfileDto {
  @IsOptional() @IsEnum(FaithJourney) journey?: FaithJourney;
  @IsOptional() @IsIn(['en','fr']) language?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsString({each:true}) learningGoals?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(5) @IsString({each:true}) preferredFormats?: string[];
  @IsOptional() @IsBoolean() personalizationConsent?: boolean;
  @IsOptional() @IsBoolean() aiProcessingConsent?: boolean;
}
@ApiTags('system')
@Controller('health')
class HealthController { @Get() health() { return { status: 'ok', service: 'lifebook-api' }; } }
@ApiTags('content')
@Controller('devotionals')
class DevotionalsController {
  constructor(private db: Database) {}
  @Get('latest') latest() { return this.db.devotional.findFirst({where:{publishedAt:{lte:new Date()}},orderBy:{publishedAt:'desc'}}); }
}
@ApiTags('discipleship')
@Controller('paths')
class PathsController {
  constructor(private db: Database) {}
  @Get() list() { return this.db.learningPath.findMany({where:{isPublished:true},select:{id:true,slug:true,title:true,description:true}}); }
}
@ApiTags('profile') @ApiBearerAuth()
@Controller('me/profile')
class ProfileController {
  constructor(private db: Database, private identity: Identity) {}
  private async user(authorization?: string) {
    const sub = await this.identity.subject(authorization);
    return this.db.user.upsert({where:{oidcSubject:sub},create:{oidcSubject:sub},update:{}});
  }
  @Get() async get(@Headers('authorization') auth?: string) {
    const user = await this.user(auth);
    return {userId:user.id,role:user.role,profile:await this.db.faithProfile.findUnique({where:{userId:user.id}})};
  }
  @Put() async update(@Headers('authorization') auth: string, @Body() dto: ProfileDto) {
    const user = await this.user(auth);
    return this.db.faithProfile.upsert({where:{userId:user.id},create:{userId:user.id,learningGoals:[],preferredFormats:[],...dto},update:dto});
  }
}
@Module({controllers:[HealthController,DevotionalsController,PathsController,ProfileController],providers:[Database,Identity]})
export class AppModule {}
