import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ChatMockService } from './chat-mock.service';
import { FooterComponent } from "../shared/components/footer/footer";
import { HeaderComponent } from "../shared/components/header/header";

@Component({
  standalone: true,
  selector: 'app-chat-inbox',
  imports: [CommonModule, RouterModule, FooterComponent, HeaderComponent],
  templateUrl: './chat-inbox.component.html',
})
export class ChatInboxComponent {
  svc = inject(ChatMockService);
  route = inject(ActivatedRoute);

  isAdmin = !!this.route.snapshot.data?.['admin'];
  base = this.isAdmin ? '/admin/chat' : '/chat';
}
