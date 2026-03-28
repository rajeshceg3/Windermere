export class WebGLDetector {
  public static isWebGLAvailable(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch {
      return false;
    }
  }

  public static isWebGL2Available(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
    } catch {
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static getWebGLCapabilities(): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const capabilities: Record<string, any> = {
      webgl: this.isWebGLAvailable(),
      webgl2: this.isWebGL2Available(),
      maxTextureSize: 0,
      maxCubemapSize: 0,
      maxRenderBufferSize: 0,
    };

    if (capabilities.webgl || capabilities.webgl2) {
      const canvas = document.createElement('canvas');
      const gl = (capabilities.webgl2 ? canvas.getContext('webgl2') : (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))) as WebGLRenderingContext | WebGL2RenderingContext | null;

      if (gl) {
        capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        capabilities.maxCubemapSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
        capabilities.maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
        capabilities.floatTextures = !!gl.getExtension('OES_texture_float');
        capabilities.halfFloatTextures = !!gl.getExtension('OES_texture_half_float');
      }
    }

    return capabilities;
  }
}
