import { Component, input } from '@angular/core';

/** Marca do AprovaLab: um "check" de aprovação em índigo. */
@Component({
  selector: 'app-brand-logo',
  template: `
    <span class="brand">
      <svg
        [attr.width]="size()"
        [attr.height]="size()"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="4" y="4" width="40" height="40" rx="12" fill="#4f46e5" />
        <path
          d="M14 24.5 L21 31.5 L34 16.5"
          stroke="#ffffff"
          stroke-width="5"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle cx="36" cy="13" r="4" fill="#22c55e" />
      </svg>
      @if (wordmark()) {
        <span class="word" [style.font-size.px]="size() * 0.58">
          Aprova<span class="lab">Lab</span>
        </span>
      }
    </span>
  `,
  styles: [
    `
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
      }
      .word {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 800;
        letter-spacing: -0.03em;
        color: currentColor;
        line-height: 1;
      }
      .lab {
        opacity: 0.75;
      }
    `,
  ],
})
export class BrandLogo {
  readonly size = input(32);
  readonly wordmark = input(false);
}
