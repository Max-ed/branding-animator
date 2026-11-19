// RGBA → I420 conversion with fixed BT.709 coefficients, limited ("TV") range.
//
// We do this ourselves instead of handing the canvas to the encoder, because
// how a browser converts RGB to YUV (matrix, range) and how it tags the result
// differs between Chrome and Safari — which is what made exports look
// desaturated. With the conversion fixed here and the file tagged to match,
// every player decodes the same colours.

const KR = 0.2126
const KB = 0.0722
const KG = 1 - KR - KB

// Inputs are 0–255 sRGB-encoded values; outputs are 8-bit limited range.
const Y_R = (219 / 255) * KR
const Y_G = (219 / 255) * KG
const Y_B = (219 / 255) * KB
const CB_R = (224 / 255) * (-KR / (2 * (1 - KB)))
const CB_G = (224 / 255) * (-KG / (2 * (1 - KB)))
const CB_B = (224 / 255) * 0.5
const CR_R = (224 / 255) * 0.5
const CR_G = (224 / 255) * (-KG / (2 * (1 - KR)))
const CR_B = (224 / 255) * (-KB / (2 * (1 - KR)))

export const BT709_LIMITED: VideoColorSpaceInit = {
  primaries: 'bt709',
  transfer: 'bt709',
  matrix: 'bt709',
  fullRange: false,
}

/** Converts tightly packed RGBA (width*height*4) into an I420 buffer. Width and height must be even. */
export function rgbaToI420(rgba: Uint8ClampedArray, width: number, height: number, out?: Uint8Array): Uint8Array {
  const ySize = width * height
  const cw = width >> 1
  const ch = height >> 1
  const cSize = cw * ch
  const buf = out ?? new Uint8Array(ySize + cSize * 2)
  const uOff = ySize
  const vOff = ySize + cSize

  for (let cy = 0; cy < ch; cy++) {
    const row0 = cy * 2
    const row1 = row0 + 1
    for (let cx = 0; cx < cw; cx++) {
      const col0 = cx * 2
      const i00 = (row0 * width + col0) * 4
      const i01 = i00 + 4
      const i10 = (row1 * width + col0) * 4
      const i11 = i10 + 4

      const r00 = rgba[i00], g00 = rgba[i00 + 1], b00 = rgba[i00 + 2]
      const r01 = rgba[i01], g01 = rgba[i01 + 1], b01 = rgba[i01 + 2]
      const r10 = rgba[i10], g10 = rgba[i10 + 1], b10 = rgba[i10 + 2]
      const r11 = rgba[i11], g11 = rgba[i11 + 1], b11 = rgba[i11 + 2]

      buf[row0 * width + col0] = 16 + Y_R * r00 + Y_G * g00 + Y_B * b00 + 0.5
      buf[row0 * width + col0 + 1] = 16 + Y_R * r01 + Y_G * g01 + Y_B * b01 + 0.5
      buf[row1 * width + col0] = 16 + Y_R * r10 + Y_G * g10 + Y_B * b10 + 0.5
      buf[row1 * width + col0 + 1] = 16 + Y_R * r11 + Y_G * g11 + Y_B * b11 + 0.5

      // Chroma from the average of the 2×2 block.
      const r = (r00 + r01 + r10 + r11) * 0.25
      const g = (g00 + g01 + g10 + g11) * 0.25
      const b = (b00 + b01 + b10 + b11) * 0.25
      const ci = cy * cw + cx
      buf[uOff + ci] = 128 + CB_R * r + CB_G * g + CB_B * b + 0.5
      buf[vOff + ci] = 128 + CR_R * r + CR_G * g + CR_B * b + 0.5
    }
  }
  return buf
}
