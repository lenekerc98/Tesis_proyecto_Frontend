const Jimp = require('jimp');

async function addBackground(imagePath) {
    try {
        console.log(`Processing ${imagePath}...`);
        const img = await Jimp.read(imagePath);

        // Create a new image with the desired background color #677059
        // Jimp uses RGBA hex, so #677059FF
        const bg = new Jimp(img.bitmap.width, img.bitmap.height, 0x677059FF);

        // Composite the original image over the background
        bg.composite(img, 0, 0);

        // Save back
        await bg.writeAsync(imagePath);
        console.log(`Success! Background added to ${imagePath}`);
    } catch (err) {
        console.error(`Error processing ${imagePath}:`, err);
    }
}

async function run() {
    await addBackground('public/ave.png');
    await addBackground('src/assets/ave.png');
}

run();
