// header.ts
import { Component, inject, computed, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIf, AsyncPipe, NgForOf, NgFor, CommonModule } from '@angular/common';
import { AuthService } from '../../services/authservice/auth';
import { CartService } from '../../services/cartservice/cart';
import { map } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { ChatStoreService } from '../../../chat/chat.store.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, NgIf, NgForOf , NgFor , CommonModule ,AsyncPipe, MatIconModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class HeaderComponent implements OnInit {
  private cart = inject(CartService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private chatStore = inject(ChatStoreService);

  unreadMessages = computed<number>(() => this.chatStore.unreadCount$());

  count$   = this.cart.items$.pipe(
    map((items) => items.reduce((s, it) => s + it.qty, 0))
  );
  user$    = this.auth.user$;
  isAdmin$ = this.auth.isAdmin$;

  ngOnInit(): void {
    // Cuando el usuario está logeado, inicializamos el store de chat
    this.user$.subscribe((u) => {
      if (!u) return;

      const id =
        (u as any)._id ??
        (u as any).id ??
        '';

      if (!id) return;

      const role = (u as any).role === 'admin' ? 'admin' : 'cliente';

      this.chatStore.setCurrentUser({
        id,
        name: (u as any).name ?? 'Yo',
        role,
      });

      // Arrancamos polling de inbox para que se actualicen
      // el globito y la preview aunque no cambies de página
      this.chatStore.startInboxPolling(role, 5000);
    });
  }

  logout() {
    this.auth.logout();
    this.chatStore.stopInboxPolling();
    this.router.navigateByUrl('/');
  }
}
