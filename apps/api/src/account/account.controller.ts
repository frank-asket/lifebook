import { Body, Controller, Get, Header, Headers, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccountService } from './account.service';

@ApiTags('account')
@Controller('me/account')
export class AccountController {
  constructor(private readonly account: AccountService) {}
  /** Everything LifeBook holds about the signed-in member, decrypted for them. Never cached. */
  @Get('export') @Header('Cache-Control', 'no-store') @ApiBearerAuth()
  exportData(@Headers('authorization') auth: string | undefined) { return this.account.exportData(auth); }
  /** Permanently deletes the signed-in member's LifeBook data and sign-in. Body: { "confirm": "DELETE_MY_ACCOUNT" }. */
  @Post('delete') @HttpCode(200) @ApiBearerAuth()
  remove(@Headers('authorization') auth: string | undefined, @Body() body: unknown) {
    return this.account.deleteAccount(auth, body && typeof body === 'object' ? (body as Record<string, unknown>).confirm : undefined);
  }
}
