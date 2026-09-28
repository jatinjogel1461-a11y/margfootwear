# 3D Model Optimization

As we increase the number of products and 3D models shown on the site, it is crucial to compress the `.glb` files to ensure fast load times and keep bundle sizes manageable. We recommend using `gltf-transform` to compress the geometry (using Draco or Meshopt) and resize the textures.

## Requirements

1. Install `gltf-transform` via npm:
   ```bash
   npm install -g @gltf-transform/cli
   ```

## Optimization Command

To optimize the models in the `public/models` directory, create a new output folder:
```bash
mkdir -p public/models/optimized
```

Then, run the following command for each model (replace `shoe-1.glb` with each filename). This applies draco compression and resizes textures to a maximum of 1024x1024:

```bash
gltf-transform optimize public/models/shoe-1.glb public/models/optimized/shoe-1.glb --texture-size 1024 --draco.method edgebreaker
```

*Note: You can also use meshopt instead of draco if preferred by appending `--meshopt` instead of `--draco`.*

After verifying the optimized models look correct, you can update your `BASE_MODELS` array in `src/lib/shoeModels.ts` to point to the new paths or overwrite the original models (if you have backups).
