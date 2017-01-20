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
}

serviceManager.register(SERVICE_ID, ImageManager);

export default ImageManager;
