const createImage = (url: string) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', error => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = `${url}?download=true`;
  })

const getRadianAngle = (degreeValue) => (degreeValue * Math.PI) / 180;

export const getCroppedImage = async (imageSrc: string, pixelCrop: any, degrees = 0) => {
  try {
    const image: any = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx: any = canvas.getContext('2d');

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate(getRadianAngle(degrees));
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    )
    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    )

    return new Promise(resolve => {
      canvas.toBlob(file => {
        resolve(URL.createObjectURL(file as Blob))
      }, 'image/jpeg')
    })
  } catch (error) {
    console.log(error);
    throw error;
  }
}
export const getRotatedImage = async (imageSrc: string, degrees = 0) => {
  try {
    const image: any = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx: any = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    if (degrees == 90 || degrees == 270) {
      canvas.width = image.height;
      canvas.height = image.width;
    } else {
      canvas.width = image.width;
      canvas.height = image.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (degrees == 90 || degrees == 270) {
      ctx.translate(image.height / 2, image.width / 2);
    } else {
      ctx.translate(image.width / 2, image.height / 2);
    }

    ctx.rotate(degrees * Math.PI / 180);
    ctx.drawImage(image, -image.width / 2, -image.height / 2)
    ctx.restore();

    return new Promise(resolve => {
      canvas.toBlob(file => {
        resolve(URL.createObjectURL(file as Blob))
      }, 'image/jpeg')
    })
  } catch (error) {
    console.log(error);
    throw error;
  }
}
