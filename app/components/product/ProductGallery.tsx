import {useState} from 'react';
import {Image} from '@shopify/hydrogen';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '~/components/ui';

type ProductGalleryImage = {
  id: string;
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

export function ProductGallery({images}: {images: ProductGalleryImage[]}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  return (
    <div>
      {activeImage ? (
        <Image
          data={activeImage}
          aspectRatio="1/1"
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="w-full rounded border border-slate-200 object-cover"
        />
      ) : (
        // Shown when the product has no images.
        <div className="flex aspect-square w-full items-center justify-center rounded border border-slate-200 bg-slate-100 text-sm text-slate-400">
          Image placeholder
        </div>
      )}

      {images.length > 0 && (
        <Carousel className="mt-3">
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={image.id} className="basis-1/6">
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`View image ${index + 1}`}
                  className={`block aspect-square w-full overflow-hidden rounded border ${
                    index === activeIndex ? 'border-navy' : 'border-slate-200'
                  }`}
                >
                  <Image
                    data={image}
                    aspectRatio="1/1"
                    sizes="120px"
                    className="h-full w-full object-cover"
                  />
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
          {images.length > 6 && (
            <>
              <CarouselPrevious />
              <CarouselNext />
            </>
          )}
        </Carousel>
      )}
    </div>
  );
}
