import { S3Disk } from '@foal/aws-s3';
import { Context, controller, dependency, Get, render, Session, TokenRequired } from '@foal/core';
import { TypeORMStore } from '@foal/typeorm';

import { AuthController } from './controllers';

export class AppController {
  @dependency
  disk: S3Disk;

  subControllers = [
    controller('', AuthController),
  ];

  @Get('/download')
  async download() {
    return this.disk.createHttpResponse('movies/iron-man.avi', {
      filename: 'movie.avi',
      forceDownload: true,
    });
  }

  @Get('/')
  @TokenRequired({ cookie: true, store: TypeORMStore, redirectTo: '/signin' })
  index(ctx: Context<any, Session>) {
    return render('./templates/index.html', {
      userInfo: JSON.stringify(ctx.session.get('userInfo'))
    });
  }

  @Get('/signin')
  signin() {
    return render('./templates/signin.html');
  }
}
