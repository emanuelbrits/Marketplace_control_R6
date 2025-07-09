import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-scroll-button',
  standalone: true,
  templateUrl: './scroll-button.component.html',
  imports: [CommonModule],
})
export class ScrollButtonComponent implements OnInit {
  showArrowDown = true;
  isAnimating = false;

  ngOnInit(): void {
    window.addEventListener('scroll', this.handleScroll, { passive: true });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll = () => {
    const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 20;
    if (atBottom !== !this.showArrowDown) {
      this.isAnimating = true;
      this.showArrowDown = !atBottom;

      setTimeout(() => (this.isAnimating = false), 300);
    }
  };

  scrollToPosition() {
    const position = this.showArrowDown ? document.body.scrollHeight : 0;
    window.scrollTo({ top: position, behavior: 'smooth' });
  }
}
