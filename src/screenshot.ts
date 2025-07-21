import sharp from 'sharp';
import { BoundingBox } from 'puppeteer';

export class ScreenshotCapture {
    async cropImage(imageBuffer: Buffer, boundingBox: BoundingBox): Promise<Buffer> {
        try {
            console.log('✂️  Cropping image to target bounds...');
            console.log(`📏 Crop bounds: x=${boundingBox.x}, y=${boundingBox.y}, width=${boundingBox.width}, height=${boundingBox.height}`);
            
            const croppedBuffer = await sharp(imageBuffer)
                .extract({
                    left: Math.round(boundingBox.x),
                    top: Math.round(boundingBox.y),
                    width: Math.round(boundingBox.width),
                    height: Math.round(boundingBox.height)
                })
                .png({ 
                    quality: 90,
                    compressionLevel: 6 
                })
                .toBuffer();
                
            console.log('✅ Image cropped successfully');
            console.log(`📊 Cropped image size: ${croppedBuffer.length} bytes`);
            
            return croppedBuffer;
        } catch (error) {
            console.error('❌ Error cropping image:', error);
            throw new Error(`Image cropping failed: ${error}`);
        }
    }

    async optimizeImage(imageBuffer: Buffer, maxWidth?: number): Promise<Buffer> {
        try {
            let pipeline = sharp(imageBuffer);
            
            if (maxWidth) {
                pipeline = pipeline.resize(maxWidth, null, {
                    withoutEnlargement: true
                });
            }
            
            return await pipeline
                .png({ 
                    quality: 90,
                    compressionLevel: 6 
                })
                .toBuffer();
        } catch (error) {
            console.error('❌ Error optimizing image:', error);
            throw new Error(`Image optimization failed: ${error}`);
        }
    }

    async getImageInfo(imageBuffer: Buffer): Promise<sharp.Metadata> {
        try {
            return await sharp(imageBuffer).metadata();
        } catch (error) {
            console.error('❌ Error getting image info:', error);
            throw new Error(`Failed to get image metadata: ${error}`);
        }
    }
}
