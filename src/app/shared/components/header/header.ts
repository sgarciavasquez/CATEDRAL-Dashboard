import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIf, AsyncPipe } from '@angular/common';
import { AuthService } from '../../services/authservice/auth';
import { CartService } from '../../services/cartservice/cart';
import { map } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { ChatStoreService } from '../../../chat/chat.store.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, NgIf, AsyncPipe, MatIconModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class HeaderComponent {
  private cart = inject(CartService);
  private auth = inject(AuthService);
  private router = inject(Router);

  chat = inject(ChatStoreService);

  // 👇 Envuelve el signal en un computed local (tipo number)
  unreadMessages = computed<number>(() => this.chat.unreadCount$());

  count$   = this.cart.items$.pipe(map(items => items.reduce((s, it) => s + it.qty, 0)));
  user$    = this.auth.user$;
  isAdmin$ = this.auth.isAdmin$;

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}
