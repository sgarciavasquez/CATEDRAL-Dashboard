// chat-inbox.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FooterComponent } from "../shared/components/footer/footer";
import { HeaderComponent } from "../shared/components/header/header";
import { ChatStoreService } from './chat.store.service';
import type { ChatRow, Role } from '../shared/services/chat/chat.types';
import { UserService, ApiUser } from '../shared/services/user/user.service';
import { ChatApiService } from '../shared/services/chat/chat.api.service';
import { firstValueFrom } from 'rxjs';

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
  chatApi = inject(ChatApiService);
  isAdmin = !!this.route.snapshot.data?.['admin'];
  role: Role = this.isAdmin ? 'admin' : 'cliente';
  base = this.isAdmin ? '/admin/chat' : '/chat';

  loading = true;
  error = '';

  constructor() {
    console.log('%c[ChatInbox] ctor', 'color:#2563eb', { isAdmin: this.isAdmin, role: this.role });

    // 1) Obtener mi usuario real y setearlo en el Store
    this.users.me().subscribe({
      next: (u: ApiUser) => {
        console.log('%c[ChatInbox] me() OK', 'color:#16a34a', u);
        this.error = ''; // 🔹 limpiamos cualquier error anterior

        const role: Role = (u?.role === 'admin') ? 'admin' : 'cliente';
        const id = u?._id ?? (u as any)?.id ?? '';
        this.svc.setCurrentUser({ id, name: u?.name ?? 'Yo', role });

        // 2) cargar inbox para mi rol
        console.log('%c[ChatInbox] loadInbox() start', 'color:#2563eb', { role: this.role });
        this.svc.loadInbox(this.role).then(() => {
          console.log('%c[ChatInbox] loadInbox() OK', 'color:#22c55e');
          this.loading = false;
        }).catch(err => {
          console.error('[ChatInbox] loadInbox() ERROR', err);
          this.loading = false;
          this.error = err?.error?.message ?? 'No se pudo cargar tus chats';
        });
      },
      error: (e) => {
        console.error('[ChatInbox] me() ERROR', e);
        this.loading = false;
        this.error = e?.error?.message ?? 'No se pudo cargar tus chats';
      }
    });
  }

  refresh() {
    console.log('%c[ChatInbox] refresh()', 'color:#0ea5e9', { role: this.role });
    this.loading = true;
    this.error = ''; // 🔹 limpiamos el mensaje antes de recargar

    this.svc.loadInbox(this.role).then(() => {
      console.log('%c[ChatInbox] loadInbox() OK (refresh)', 'color:#22c55e');
      this.loading = false;
    }).catch(err => {
      console.error('[ChatInbox] loadInbox() ERROR (refresh)', err);
      this.loading = false;
      this.error = err?.error?.message ?? 'No se pudo recargar la bandeja';
    });
  }

  // borrar chat sólo de mi bandeja
  async deleteChat(c: ChatRow, ev: MouseEvent) {
    ev.preventDefault();
    ev.stopPropagation(); // para que no navegue al chat

    const nombre = c.otherName || 'este cliente';
    const ok = confirm(`¿Eliminar el chat con ${nombre} de tu bandeja?`);
    if (!ok) return;

    try {
      console.log('%c[ChatInbox] deleteChat ->', 'color:#dc2626', c);
      await firstValueFrom(this.chatApi.delete(c.id));
      this.svc.removeChat(c.id);  // lo sacamos del store
      console.log('%c[ChatInbox] deleteChat OK', 'color:#22c55e', c.id);
    } catch (e) {
      console.error('[ChatInbox] deleteChat ERROR', e);
      alert('No se pudo eliminar el chat, intenta de nuevo.');
    }
  }
}
