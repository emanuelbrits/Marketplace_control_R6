import { Component, OnInit } from '@angular/core';
import { supabase } from '../supabase-client';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from "./shared/navbar/navbar.component";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class AppComponent implements OnInit {
  ngOnInit(): void {
    console.log();
  }
  title = 'Lista de Itens em Cards';
}
