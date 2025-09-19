import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

// 👇 importa las piezas que usa tu template
import { NgIf, AsyncPipe } from '@angular/common';

import { AuthService } from '../../services/authservice/auth';
import { CartService } from '../../services/cartservice/cart';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, NgIf, AsyncPipe],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class HeaderComponent {
  private cart = inject(CartService);
  private auth = inject(AuthService);
  private router = inject(Router);

  count$ = this.cart.items$.pipe(map(items => items.reduce((s, it) => s + it.qty, 0)));
  user$  = this.auth.user$;

  logout() { this.auth.logout(); this.router.navigateByUrl('/'); }
}
