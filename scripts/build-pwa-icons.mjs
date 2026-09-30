// Regenerate only when the source changes; bump the versioned filenames then.
import sharp from 'sharp';
const source=new URL('../public/pwa/icon-source.svg',import.meta.url);
for(const [name,size] of [['icon-192-v1.png',192],['icon-512-v1.png',512],['icon-maskable-v1.png',512],['apple-touch-icon-v1.png',180]]){
  await sharp(source.pathname).resize(size,size).flatten({background:'#14291f'}).png().toFile(new URL('../public/pwa/'+name,import.meta.url).pathname);
}
console.log('Generated 192px, 512px, maskable and 180px Apple icons.');
