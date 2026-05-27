'use client'

import { useState } from 'react'
import Image from 'next/image'

type RestaurantImage = {
  id: string
  image_url: string
  alt_text: string | null
  caption: string | null
  is_primary: boolean
  sort_order: number
}

type RestaurantImageGalleryProps = {
  images: RestaurantImage[]
  fallbackAlt: string
}

export default function RestaurantImageGallery({
  images,
  fallbackAlt,
}: RestaurantImageGalleryProps) {
  const [activeImageId, setActiveImageId] = useState(images[0]?.id ?? null)

  if (images.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-b-4xl bg-foreground">
        <p className="text-sm font-bold text-white/70">Geen afbeelding beschikbaar</p>
      </div>
    )
  }

  const activeImage = images.find((image) => image.id === activeImageId) ?? images[0]

  return (
    <section>
      <div className="relative h-72 w-full overflow-hidden rounded-b-4xl bg-foreground">
        <Image
          src={activeImage.image_url}
          alt={activeImage.alt_text ?? fallbackAlt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 420px"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-linear-to-t from-foreground/45 via-transparent to-foreground/10" />

        {activeImage.caption && (
          <div className="absolute bottom-4 left-4 right-4">
            <p className="line-clamp-1 rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-foreground backdrop-blur">
              {activeImage.caption}
            </p>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="-mt-8 flex gap-3 overflow-x-auto px-fluid-main pb-2">
          {images.map((image) => {
            const isActive = image.id === activeImage.id

            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveImageId(image.id)}
                className={[
                  'relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl border-2 bg-white shadow-lg transition-all',
                  isActive ? 'border-primary' : 'border-white',
                ].join(' ')}
              >
                <Image
                  src={image.image_url}
                  alt={image.alt_text ?? fallbackAlt}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}