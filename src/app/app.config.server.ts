import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig as clientConfig } from './app.config';

const serverOnly: ApplicationConfig = {
  providers: [provideServerRendering()],
};

export const appConfig: ApplicationConfig =
  mergeApplicationConfig(clientConfig, serverOnly);
