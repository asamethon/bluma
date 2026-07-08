// NSFW görsel tespiti — nsfwjs (TensorFlow.js) ile VPS'te YEREL çalışır.
// Ücretsiz, limitsiz, dış API yok. Model bir kez belleğe yüklenir (~25MB);
// her görsel ~100ms'de sınıflandırılır: Neutral/Drawing/Sexy/Hentai/Porn.
import * as tf from '@tensorflow/tfjs-node';
import * as nsfwjs from 'nsfwjs';
import sharp from 'sharp';

// Bu olasılığın üstündeki skor "explicit" sayılır. Env ile ayarlanabilir.
const PORN = Number(process.env.NSFW_PORN_THRESHOLD || 0.6);
const HENTAI = Number(process.env.NSFW_HENTAI_THRESHOLD || 0.6);
const SEXY = Number(process.env.NSFW_SEXY_THRESHOLD || 0.9);
// Model yüklenemezse: 'true' → yüklemeleri reddet (fail-closed),
// aksi halde kontrolü atla ve yüklemeye izin ver (fail-open, varsayılan).
const FAIL_CLOSED = process.env.NSFW_FAIL_CLOSED === 'true';
// İsteğe bağlı: modeli belirli bir URL/dosyadan yükle (örn. 'file:///opt/.../model/').
const MODEL_URL = process.env.NSFW_MODEL_URL || '';

let model = null;
let loadFailed = false;

// Sunucu açılışında bir kez çağrılır. Hata olsa da fırlatmaz (sunucu ayakta kalır).
export async function loadNsfwModel() {
  try {
    model = MODEL_URL ? await nsfwjs.load(MODEL_URL) : await nsfwjs.load();
    console.log('nsfw: model yüklendi (thresholds porn=%s hentai=%s sexy=%s)', PORN, HENTAI, SEXY);
  } catch (err) {
    loadFailed = true;
    console.error(
      'nsfw: model YÜKLENEMEDİ —', err?.message || err,
      FAIL_CLOSED ? '(fail-closed: yüklemeler reddedilecek)' : '(fail-open: kontrol atlanacak)'
    );
  }
}

// Görseli sınıflandırır. Döner: { explicit: bool, score: {...} } veya
// null (kontrol atlandı — model yok ve fail-open).
export async function checkImage(buffer) {
  if (!model) {
    // Model yüklenemediyse politikaya göre davran.
    return FAIL_CLOSED && loadFailed ? { explicit: true, score: { reason: 'model_unavailable' } } : null;
  }
  // sharp ile 224x224 ham RGB'ye indir (nsfwjs bu tensörü sınıflandırır).
  const { data, info } = await sharp(buffer)
    .removeAlpha()
    .resize(224, 224, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const input = tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3]);
  let preds;
  try {
    preds = await model.classify(input);
  } finally {
    input.dispose();
  }

  const score = Object.fromEntries(preds.map((p) => [p.className, Number(p.probability.toFixed(3))]));
  const explicit =
    (score.Porn || 0) >= PORN || (score.Hentai || 0) >= HENTAI || (score.Sexy || 0) >= SEXY;
  return { explicit, score };
}
