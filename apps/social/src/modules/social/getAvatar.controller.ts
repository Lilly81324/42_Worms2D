import { Controller, Get, Query } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { IsString } from 'class-validator';



export class GetAvatarsDto {
  @IsString()
  userIds: string;
}


@Controller('users/profile/pic')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
  ) {}

  @Get('avatars')
  async getAvatars(
    @Query() query: GetAvatarsDto,
  ) {
    return this.profileService.getAvatars(
      query.userIds,
    );
  }
}

//GET /users/profiles/pic/avatars?userIds=id1,id2,id3