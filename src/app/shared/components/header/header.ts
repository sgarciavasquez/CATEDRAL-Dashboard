import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart';
import { map } from 'rxjs';
import { AuthService } from '../../services/auth';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})

export class HeaderComponent {
  private cart = inject(CartService);
  private auth = inject(AuthService);
  private router = inject(Router);

  count$ = this.cart.items$.pipe(map(items => items.reduce((s, it) => s + it.qty, 0)));
  user$ = this.auth.user$;

  logout() { this.auth.logout(); this.router.navigateByUrl('/'); }
}