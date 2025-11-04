import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class AppComponent {}
