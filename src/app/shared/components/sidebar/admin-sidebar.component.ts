import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-admin-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
})
export class AdminSidebarComponent {}
