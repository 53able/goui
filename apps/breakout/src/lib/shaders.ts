/**
 * p5.js用シェーダー定義
 * WebGL 2.0 (GLSL ES 3.00) 対応
 */

/**
 * ブルームシェーダー（光のにじみ効果）
 * 明るい部分を抽出してぼかす
 */
export const bloomShader = {
  vert: `#version 300 es
    precision highp float;
    
    in vec3 aPosition;
    in vec2 aTexCoord;
    
    out vec2 vTexCoord;
    
    void main() {
      vTexCoord = aTexCoord;
      vec4 positionVec4 = vec4(aPosition, 1.0);
      positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
      gl_Position = positionVec4;
    }
  `,
  frag: `#version 300 es
    precision highp float;
    
    uniform sampler2D uTexture;
    uniform vec2 uResolution;
    uniform float uBloomIntensity;
    uniform float uTime;
    
    in vec2 vTexCoord;
    out vec4 fragColor;
    
    // ガウシアンブラー
    vec4 blur(sampler2D tex, vec2 uv, vec2 resolution, float radius) {
      vec4 color = vec4(0.0);
      float total = 0.0;
      
      for (float x = -4.0; x <= 4.0; x += 1.0) {
        for (float y = -4.0; y <= 4.0; y += 1.0) {
          vec2 offset = vec2(x, y) * radius / resolution;
          float weight = 1.0 - length(vec2(x, y)) / 5.66;
          if (weight > 0.0) {
            color += texture(tex, uv + offset) * weight;
            total += weight;
          }
        }
      }
      
      return color / total;
    }
    
    void main() {
      vec4 original = texture(uTexture, vTexCoord);
      
      // 明るい部分を抽出
      float brightness = dot(original.rgb, vec3(0.299, 0.587, 0.114));
      vec4 bright = original * smoothstep(0.5, 1.0, brightness);
      
      // ブラーをかける
      vec4 blurred = blur(uTexture, vTexCoord, uResolution, 3.0 * uBloomIntensity);
      
      // 元の画像とブルームを合成
      vec4 bloom = blurred * uBloomIntensity * 0.5;
      
      fragColor = original + bloom;
      fragColor.a = 1.0;
    }
  `,
};

/**
 * グリッチシェーダー（デジタルノイズ効果）
 * 画面が乱れるサイバーパンク風エフェクト
 */
export const glitchShader = {
  vert: `#version 300 es
    precision highp float;
    
    in vec3 aPosition;
    in vec2 aTexCoord;
    
    out vec2 vTexCoord;
    
    void main() {
      vTexCoord = aTexCoord;
      vec4 positionVec4 = vec4(aPosition, 1.0);
      positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
      gl_Position = positionVec4;
    }
  `,
  frag: `#version 300 es
    precision highp float;
    
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uGlitchIntensity;
    uniform vec2 uResolution;
    
    in vec2 vTexCoord;
    out vec4 fragColor;
    
    // 疑似乱数
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    void main() {
      vec2 uv = vTexCoord;
      
      // グリッチ強度が低い場合はそのまま返す
      if (uGlitchIntensity < 0.01) {
        fragColor = texture(uTexture, uv);
        return;
      }
      
      // 時間ベースのランダムシード
      float t = floor(uTime * 20.0);
      
      // 水平方向のズレ
      float hShift = (random(vec2(t, uv.y * 10.0)) - 0.5) * uGlitchIntensity * 0.1;
      
      // ブロックノイズ
      float blockY = floor(uv.y * 20.0) / 20.0;
      float blockNoise = step(0.95 - uGlitchIntensity * 0.3, random(vec2(t, blockY)));
      hShift += blockNoise * (random(vec2(t + 1.0, blockY)) - 0.5) * 0.2;
      
      // スキャンライン
      float scanline = sin(uv.y * uResolution.y * 2.0 + uTime * 10.0) * 0.02 * uGlitchIntensity;
      
      // RGB分離（色収差）
      float rgbSplit = uGlitchIntensity * 0.01;
      vec4 r = texture(uTexture, vec2(uv.x + hShift + rgbSplit, uv.y + scanline));
      vec4 g = texture(uTexture, vec2(uv.x + hShift, uv.y + scanline));
      vec4 b = texture(uTexture, vec2(uv.x + hShift - rgbSplit, uv.y + scanline));
      
      fragColor = vec4(r.r, g.g, b.b, 1.0);
      
      // ランダムな白いノイズライン
      if (random(vec2(t, uv.y * 100.0)) > 0.999 - uGlitchIntensity * 0.01) {
        fragColor = vec4(1.0);
      }
    }
  `,
};

/**
 * クロマティックアベレーション（色収差）シェーダー
 * RGBがずれる効果
 */
export const chromaticShader = {
  vert: `#version 300 es
    precision highp float;
    
    in vec3 aPosition;
    in vec2 aTexCoord;
    
    out vec2 vTexCoord;
    
    void main() {
      vTexCoord = aTexCoord;
      vec4 positionVec4 = vec4(aPosition, 1.0);
      positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
      gl_Position = positionVec4;
    }
  `,
  frag: `#version 300 es
    precision highp float;
    
    uniform sampler2D uTexture;
    uniform float uIntensity;
    uniform vec2 uResolution;
    
    in vec2 vTexCoord;
    out vec4 fragColor;
    
    void main() {
      vec2 uv = vTexCoord;
      vec2 center = vec2(0.5, 0.5);
      vec2 dir = uv - center;
      float dist = length(dir);
      
      float offset = dist * uIntensity * 0.02;
      
      float r = texture(uTexture, uv + dir * offset).r;
      float g = texture(uTexture, uv).g;
      float b = texture(uTexture, uv - dir * offset).b;
      
      fragColor = vec4(r, g, b, 1.0);
    }
  `,
};
