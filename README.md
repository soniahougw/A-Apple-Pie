A Apple Pie — Simple static gallery demo

This small static site demonstrates a reusable gallery component that allows clicking through 15 images on each page.

Files:
- index.html — home page with gallery
- about.html — another page that also includes the same gallery
- css/styles.css — basic styling
- js/gallery.js — gallery logic (thumbnails, prev/next, keyboard)
- images/img1.svg ... img15.svg — placeholder images

Note about using your own images:
- The gallery now expects images named `p1.jpg` through `p15.jpg` in the `images/` folder. If those files are present they will be used.
- If a `pN.jpg` file is missing or fails to load, the gallery will automatically fall back to the provided SVG placeholders `imgN.svg`.
Note: the gallery now displays a single large image on each page (no thumbnail strip). Use the prev/next buttons or left/right arrow keys to navigate the 15 images.

How to view locally:

Open `index.html` directly in a browser, or from the project folder run a simple HTTP server (recommended):

```bash
# from /Users/sonia/Desktop/0420/AApplePie
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

To use your own images: replace the files in `images/` (keep the names img1..img15 or update the `data-gallery` attribute on the gallery element in the HTML).
