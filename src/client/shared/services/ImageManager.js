import { Service, serviceManager } from 'soundworks/client';

const SERVICE_ID = 'service:image-manager';



class ImageManager extends Service {
  constructor() {
    super(SERVICE_ID, false);

    const defaults = {
      files: {},
    };

    this.images = {};
  }

  configure(options) {
    if (options.files) {
      if (!this.options.files)
        this.options.files = {};

      Object.assign(this.options.files, options.files);
      delete options.files;
    }

    super.configure(options);
  }

  start() {
    const files = this.options.files;
    const nbrFiles = Object.keys(files).length;
    this._nbrFiles = nbrFiles;
    this._counter = 0;

    for (let name in files) {
      const path = files[name];
      const image = new Image();
      image.src = path;
      image.onload = this._onLoad(name, image);
    }
  }

  _onLoad(name, image) {
    return () => {
      this.images[name] = image;
      this._counter += 1;

      if (this._counter >= this._nbrFiles)
        this.ready();
    };
  }

  get(name) {
    return this.images[name];
  }

  getAsCanvas(name) {
    const img = this.images[name];
    const w = img.width;
    const h = img.height;
    const $canvas = document.createElement('canvas');
    const ctx = $canvas.getContext('2d');
    ctx.canvas.width = w;
    ctx.canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);

    return $canvas;
  }

  getAsHalfSizeCanvas(name) {
    const img = this.images[name];
    const w = img.width;
    const h = img.height;
    const $canvas = document.createElement('canvas');
    const ctx = $canvas.getContext('2d');
    ctx.canvas.width = w;
    ctx.canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h, 0, 0, Math.floor(w / 2), Math.floor(h / 2));

    return $canvas;
  }
}

serviceManager.register(SERVICE_ID, ImageManager);

export default ImageManager;
