import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
} from '@nestjs/common';
import { BroadcastService } from './broadcast.service';
import { CreateBroadcastDto, UpdateBroadcastDto } from './broadcast.dto';

@Controller('broadcasts')
export class BroadcastController {
  constructor(private readonly broadcast: BroadcastService) {}

  /* GET /broadcasts?businessId= */
  @Get()
  findAll(@Query('businessId') businessId: string) {
    return this.broadcast.findAll(businessId);
  }

  /* GET /broadcasts/:id */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.broadcast.findOne(id);
  }

  /* POST /broadcasts?businessId= */
  @Post()
  create(
    @Query('businessId') businessId: string,
    @Body() dto: CreateBroadcastDto,
  ) {
    return this.broadcast.create(businessId, dto);
  }

  /* PATCH /broadcasts/:id */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBroadcastDto) {
    return this.broadcast.update(id, dto);
  }

  /* DELETE /broadcasts/:id */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.broadcast.remove(id);
  }

  /* POST /broadcasts/:id/schedule — activate scheduling */
  @Post(':id/schedule')
  schedule(@Param('id') id: string) {
    return this.broadcast.schedule(id);
  }

  /* POST /broadcasts/:id/pause */
  @Post(':id/pause')
  pause(@Param('id') id: string) {
    return this.broadcast.pause(id);
  }

  /* POST /broadcasts/:id/send — immediate dispatch */
  @Post(':id/send')
  sendNow(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
  ) {
    return this.broadcast.sendNow(id, businessId);
  }
}
