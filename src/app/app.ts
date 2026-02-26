import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import * as THREE from 'three';
import { WINDOW } from '../core/window.token';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private window = inject(WINDOW);
  private destroyRef = inject(DestroyRef);

  private canvasRef = viewChild.required<ElementRef<HTMLDivElement>>('canvasContainer');

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;

  // ¡AQUÍ ESTÁ LA CLAVE! Guardamos el cubo en una variable para no perderlo
  private cube!: THREE.Mesh;

  private animationId: number = 0;

  constructor() {
    afterNextRender({
      write: () => {
        // Fase de escritura: Inicializamos Three.js
        this.initThree();
        this.animate();
      },
    });
  }

  private initThree() {
    const container = this.canvasRef().nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Escena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    // 2. Cámara
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(5, 5, 5); // Un poco más alto
    this.camera.lookAt(0, 0, 0); // Mirando al centro

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // --- OBJETOS ---

    // A. El Plano (Suelo)
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    // Usamos GridHelper mejor para que se vea "tech", pero si quieres plano solido:
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2; // Acostamos el plano
    this.scene.add(plane);

    // B. El Cubo (¡Lo guardamos en this.cube!)
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshNormalMaterial();
    this.cube = new THREE.Mesh(geometry, material); // <--- GUARDAMOS REFERENCIA
    this.cube.position.y = 0.5; // Lo subimos para que no atraviese el suelo
    this.scene.add(this.cube);
    const gridHelper = new THREE.GridHelper();

    // Helpers
    this.scene.add(gridHelper);
    this.scene.add(new THREE.AxesHelper(2));

    // Listeners
    const resizeHandler = this.onWindowResize.bind(this);
    this.window.addEventListener('resize', resizeHandler);

    // REEMPLAZO DE ngOnDestroy (Limpieza automática)
    this.destroyRef.onDestroy(() => {
      this.window.removeEventListener('resize', resizeHandler);
      cancelAnimationFrame(this.animationId);
      this.renderer.dispose();
      console.log('ThreeJS destruido limpiamente');
    });
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // CORRECCIÓN: Ahora solo giramos 'this.cube', no "cualquier cosa que encuentres"
    if (this.cube) {
      this.cube.rotation.x += 0.01;
      this.cube.rotation.y += 0.01;
    }

    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize() {
    if (!this.renderer || !this.camera) return;

    const container = this.canvasRef().nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
