import { Injectable } from '@angular/core';
import { Human, Config, Result } from '@vladmandic/human';
import { FaceDetection, Face, ClassificationMode } from '@capacitor-mlkit/face-detection';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { EmbeddingGaleria, calcularMaximaSimilitudCoseno, extraerVectoresGaleria } from './embedding-galeria.util';

export interface DescriptorConScore {
  embedding: number[];
  score: number;
}

export interface CapturaFacial {
  imageBase64: string;
  embedding: number[];
  score: number;
}

function wasmAssetsPath(): string {
  const baseHref = document.querySelector('base')?.getAttribute('href') ?? '/';
  const normalizedBase = baseHref.endsWith('/') ? baseHref : `${baseHref}/`;
  if (Capacitor.isNativePlatform()) {
    return `${window.location.origin}${normalizedBase}assets/tfjs-wasm/`;
  }
  return new URL('assets/tfjs-wasm/', new URL(normalizedBase, window.location.href)).href;
}

@Injectable({
  providedIn: 'root'
})
export class FaceRecognitionService {
  private human: Human | null = null;
  private initPromise: Promise<void> | null = null;
  private backendActivo: 'wasm' | 'webgl' | null = null;

  private buildConfig(backend: 'wasm' | 'webgl'): Partial<Config> {
    const config: Partial<Config> = {
      backend,
      modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human@3.3.6/models/',
      filter: { enabled: true, equalization: false },
      face: {
        enabled: true,
        detector: { rotation: true, maxDetected: 1 },
        mesh: { enabled: true },
        attention: { enabled: false },
        iris: { enabled: true },
        description: { enabled: true },
        emotion: { enabled: false },
        antispoof: { enabled: false },
        liveness: { enabled: false }
      },
      body: { enabled: false },
      hand: { enabled: false },
      object: { enabled: false },
      gesture: { enabled: false }
    };

    if (backend === 'wasm') {
      config.wasmPath = wasmAssetsPath();
    }

    return config;
  }

  async init(): Promise<void> {
    if (this.human) {
      return;
    }
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.inicializarMotor().catch((err) => {
      this.human = null;
      this.backendActivo = null;
      this.initPromise = null;
      throw err;
    });

    return this.initPromise;
  }

  private async inicializarMotor(): Promise<void> {
    const backends: Array<'wasm' | 'webgl'> = ['wasm', 'webgl'];
    let ultimoError: unknown = null;

    for (const backend of backends) {
      try {
        const human = new Human(this.buildConfig(backend));
        await human.init();
        await human.load();
        await human.warmup();
        this.human = human;
        this.backendActivo = backend;
        console.info(`[FaceRecognition] Motor activo: ${backend}`);
        return;
      } catch (error) {
        ultimoError = error;
        console.warn(`[FaceRecognition] No se pudo iniciar backend ${backend}`, error);
      }
    }

    throw ultimoError ?? new Error('No se pudo inicializar el motor facial');
  }

  async prepararImagen(dataUrl: string, maxSize = 640): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo preparar la imagen'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
      img.src = dataUrl;
    });
  }

  async detect(input: HTMLImageElement | HTMLVideoElement): Promise<Result> {
    await this.init();
    return await this.human!.detect(input);
  }

  async getDescriptor(input: HTMLImageElement | HTMLVideoElement | string): Promise<number[] | null> {
    const resultado = await this.getDescriptorConScore(input);
    return resultado?.embedding ?? null;
  }

  async getDescriptorConScore(input: HTMLImageElement | HTMLVideoElement | string): Promise<DescriptorConScore | null> {
    return this.getDescriptorConScoreConTimeout(input, 20000);
  }

  async getDescriptorConScoreDesdeImagen(dataUrl: string): Promise<DescriptorConScore | null> {
    await this.init();
    const image = new Image();
    image.src = dataUrl;
    image.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('No se pudo cargar el frame capturado'));
    });
    return this.getDescriptorConScoreConTimeout(image, 20000);
  }

  private async getDescriptorConScoreConTimeout(
    input: HTMLVideoElement | HTMLImageElement | string,
    timeoutMs: number
  ): Promise<DescriptorConScore | null> {
    await this.init();

    let target: HTMLVideoElement | HTMLImageElement;
    if (typeof input === 'string') {
      const image = new Image();
      image.src = input;
      image.crossOrigin = 'Anonymous';
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });
      target = image;
    } else {
      target = input;
    }

    const deteccion = await Promise.race([
      this.human!.detect(target),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
    ]);

    if (!deteccion || !deteccion.face || deteccion.face.length === 0) {
      return null;
    }

    const face = deteccion.face[0];
    const embedding = Array.from(face.embedding as unknown as number[]);
    if (embedding.length === 0) {
      return null;
    }

    return {
      embedding,
      score: face.score ?? 0
    };
  }

  similarity(embedding1: number[], embedding2: number[]): number {
    if (!embedding1 || !embedding2) {
      return 0;
    }
    return this.human?.match.similarity(embedding1, embedding2) || 0;
  }

  calcularMejorSimilitudConGaleria(embedding: number[], galeria: EmbeddingGaleria): number {
    const vectores = extraerVectoresGaleria(galeria);
    if (!embedding?.length || vectores.length === 0) {
      return 0;
    }

    const similitudCoseno = calcularMaximaSimilitudCoseno(embedding, vectores);
    if (!this.human) {
      return similitudCoseno;
    }

    let maximaHuman = 0;
    for (const referencia of vectores) {
      const similitud = this.similarity(embedding, referencia);
      if (similitud > maximaHuman) {
        maximaHuman = similitud;
      }
    }

    return Math.max(similitudCoseno, maximaHuman);
  }

  async fastDetectFace(base64Image: string): Promise<Face[]> {
    try {
      const fileName = 'temp_mlkit_frame.jpg';
      const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      const { uri } = await Filesystem.getUri({
        path: fileName,
        directory: Directory.Cache,
      });

      const result = await FaceDetection.processImage({
        path: uri,
        classificationMode: ClassificationMode.All
      });

      return result.faces;
    } catch (e) {
      console.error('Error en ML Kit Face Detection:', e);
      return [];
    }
  }
}
