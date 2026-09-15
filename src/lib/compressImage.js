export const compressImage = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new window.Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > MAX_WIDTH) {
            h *= MAX_WIDTH / w;
            w = MAX_WIDTH;
          }
        } else {
          if (h > MAX_HEIGHT) {
            w *= MAX_HEIGHT / h;
            h = MAX_HEIGHT;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  });

