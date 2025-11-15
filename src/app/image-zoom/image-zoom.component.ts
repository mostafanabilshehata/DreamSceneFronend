import { Component } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
@Component({
  selector: 'app-image-zoom',
  standalone: true,
  imports: [DialogModule],
  templateUrl: './image-zoom.component.html',
  styleUrl: './image-zoom.component.css'
})
export class ImageZoomComponent {
  imageSrc = 'assets/images/shirt1.png'; // <-- make sure this path is correct
  zoom = 2;                // zoom factor for hover (2 => 200%)
  backgroundPos = '50% 50%';
  isZooming = false;
  showDialog = false;
  zoomEnabled = false; // zoom is off by default

  
toggleZoom() {
  this.zoomEnabled = !this.zoomEnabled;
}


  onMouseMove(e: MouseEvent) {
    const el = e.currentTarget as HTMLElement;              // use currentTarget
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    this.backgroundPos = `${x}% ${y}%`;
    // console.log(this.backgroundPos); // uncomment to debug
  }

  onMouseEnter() { this.isZooming = true; }
  onMouseLeave() { this.isZooming = false; }

  
  openDialog() { this.showDialog = true; }
  closeDialog() { this.showDialog = false; }
}

