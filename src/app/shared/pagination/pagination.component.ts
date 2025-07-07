import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  imports: [CommonModule],
})
export class PaginationComponent {
  @Input() items: any[] = [];
  @Input() itemsPerPage: number = 8;

  @Output() pageChanged = new EventEmitter<any[]>(); // Emite a lista da página atual

  currentPage = 1;

  get totalPages() {
    return Math.ceil(this.items.length / this.itemsPerPage);
  }

  get paginatedItems() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.items.slice(start, start + this.itemsPerPage);
  }

  ngOnChanges() {
    this.emitCurrentPageItems();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.emitCurrentPageItems();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private emitCurrentPageItems() {
    this.pageChanged.emit(this.paginatedItems);
  }
}
