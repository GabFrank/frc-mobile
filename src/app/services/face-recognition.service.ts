import { Injectable } from '@angular/core';
import { Human, Config, Result } from '@vladmandic/human';
import { FaceDetection, Face, ClassificationMode } from '@capacitor-mlkit/face-detection';
import { Filesystem, Directory } from '@capacitor/filesystem';

export interface DescriptorConScore {
    embedding: number[];
    score: number;
}

export interface CapturaFacial {
    imageBase64: string;
    embedding: number[];
    score: number;
}

@Injectable({
    providedIn: 'root'
})
export class FaceRecognitionService {
    private human: Human | null = null;
    private initPromise: Promise<void> | null = null;
    private config: Partial<Config> = {
        backend: 'webgl',
        modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human@3.3.6/models/',
        filter: { enabled: true, equalization: false },
        face: {
            enabled: true,
            detector: { rotation: true },
            mesh: { enabled: true },
            attention: { enabled: false },
            iris: { enabled: false },
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

    async init(): Promise<void> {
        if (this.human) {
            return;
        }
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            this.human = new Human(this.config);
            await this.human.init();
            await this.human.load();
            await this.human.warmup();
        })().catch((err) => {
            this.human = null;
            this.initPromise = null;
            throw err;
        });

        return this.initPromise;
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
        await this.init();

        let result: Result;
        if (typeof input === 'string') {
            const image = new Image();
            image.src = input;
            image.crossOrigin = 'Anonymous';
            await new Promise((resolve, reject) => {
                image.onload = resolve;
                image.onerror = reject;
            });
            result = await this.human!.detect(image);
        } else {
            result = await this.human!.detect(input);
        }

        if (result.face && result.face.length > 0) {
            const face = result.face[0];
            const embedding = Array.from(face.embedding as unknown as number[]);
            if (embedding.length === 0) {
                return null;
            }
            return {
                embedding,
                score: face.score ?? 0
            };
        }
        return null;
    }

    fusionarEmbeddings(capturas: CapturaFacial[], scoreMinimo: number = 0.3): number[] | null {
        const validas = capturas.filter(
            c => c.score >= scoreMinimo && c.embedding?.length > 0
        );
        if (validas.length === 0) {
            return null;
        }

        const dim = validas[0].embedding.length;
        const promedio = new Array(dim).fill(0);
        let pesoTotal = 0;

        for (const captura of validas) {
            const peso = captura.score;
            pesoTotal += peso;
            for (let i = 0; i < dim; i++) {
                promedio[i] += captura.embedding[i] * peso;
            }
        }

        for (let i = 0; i < dim; i++) {
            promedio[i] /= pesoTotal;
        }

        const magnitud = Math.sqrt(promedio.reduce((sum, val) => sum + val * val, 0));
        if (magnitud > 0) {
            for (let i = 0; i < dim; i++) {
                promedio[i] /= magnitud;
            }
        }

        return promedio;
    }

    similarity(embedding1: number[], embedding2: number[]): number {
        if (!embedding1 || !embedding2) return 0;
        return this.human?.match.similarity(embedding1, embedding2) || 0;
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
