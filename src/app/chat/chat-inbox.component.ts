// chat-inbox.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FooterComponent } from "../shared/components/footer/footer";
import { HeaderComponent } from "../shared/components/header/header";
import { ChatStoreService } from './chat.store.service';
import type { Role } from '../shared/services/chat/chat.types';
import { UserService, ApiUser } from '../shared/services/user/user.service';

@Component({
  standalone: true,
  selector: 'app-chat-inbox',
  imports: [CommonModule, RouterModule, FooterComponent, HeaderComponent],
  templateUrl: './chat-inbox.component.html',
})
export class ChatInboxComponent {
  svc = inject(ChatStoreService);
  route = inject(ActivatedRoute);
  users = inject(UserService);

  isAdmin = !!this.route.snapshot.data?.['admin'];
  role: Role = this.isAdmin ? 'admin' : 'cliente';
  base = this.isAdmin ? '/admin/chat' : '/chat';

  loading = true;
  error = '';

  constructor() {
    // 1) Obtener mi usuario real y setearlo en el Store
    this.users.me().subscribe({
      next: (u: ApiUser) => {
        // mapear role del backend ('admin' | 'customer') a ('admin' | 'cliente')
        const role = (u?.role === 'admin') ? 'admin' : 'cliente';
        const id = u?._id ?? (u as any)?.id ?? '';
        this.svc.setCurrentUser({ id, name: u?.name ?? 'Yo', role });
        // 2) cargar inbox para mi rol
        this.svc.loadInbox(this.role).then(() => this.loading = false);
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.message ?? 'No se pudo cargar tus chats';
      }
    });
  }

  refresh() {
    this.loading = true;
    this.svc.loadInbox(this.role).then(() => this.loading = false);
  }
}
